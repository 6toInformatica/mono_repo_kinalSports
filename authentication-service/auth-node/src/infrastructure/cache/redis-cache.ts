import net from 'node:net';

export interface CacheStore {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttlSeconds: number): Promise<void>;
  del(...keys: string[]): Promise<void>;
  delByPrefix(prefix: string): Promise<void>;
}

interface MemoryEntry {
  raw: string;
  expiresAt: number;
}

const MEMORY_MAX_KEYS = 2_000;
const COMMAND_TIMEOUT_MS = 1_500;

/** Codifica un comando Redis en protocolo RESP2 usando longitud en bytes UTF-8 */
const encodeCommand = (args: string[]): Buffer => {
  const chunks: Buffer[] = [Buffer.from(`*${args.length}\r\n`, 'utf8')];
  for (const arg of args) {
    const buf = Buffer.from(arg, 'utf8');
    chunks.push(
      Buffer.from(`$${buf.length}\r\n`, 'utf8'),
      buf,
      Buffer.from('\r\n', 'utf8')
    );
  }
  return Buffer.concat(chunks);
};

/**
 * Parsea una respuesta RESP2 completa desde un Buffer.
 * Devuelve undefined si el buffer aún está incompleto.
 */
const parseResp = (
  buf: Buffer,
  offset = 0
): { value: unknown; nextOffset: number } | undefined => {
  if (offset >= buf.length) return undefined;
  const lineEnd = buf.indexOf('\r\n', offset);
  if (lineEnd === -1) return undefined;

  const prefix = String.fromCharCode(buf[offset]!);
  const head = buf.subarray(offset + 1, lineEnd).toString('utf8');

  if (prefix === '+' || prefix === ':') {
    return {
      value: prefix === ':' ? Number(head) : head,
      nextOffset: lineEnd + 2,
    };
  }
  if (prefix === '-') {
    return { value: new Error(head), nextOffset: lineEnd + 2 };
  }
  if (prefix === '$') {
    const byteLen = Number.parseInt(head, 10);
    if (byteLen === -1) return { value: null, nextOffset: lineEnd + 2 };
    const bodyStart = lineEnd + 2;
    const bodyEnd = bodyStart + byteLen;
    if (buf.length < bodyEnd + 2) return undefined;
    return {
      value: buf.subarray(bodyStart, bodyEnd).toString('utf8'),
      nextOffset: bodyEnd + 2,
    };
  }
  if (prefix === '*') {
    const count = Number.parseInt(head, 10);
    if (count === -1) return { value: null, nextOffset: lineEnd + 2 };
    const items: unknown[] = [];
    let cursor = lineEnd + 2;
    for (let i = 0; i < count; i++) {
      const parsed = parseResp(buf, cursor);
      if (!parsed) return undefined;
      items.push(parsed.value);
      cursor = parsed.nextOffset;
    }
    return { value: items, nextOffset: cursor };
  }
  return undefined;
};

const parseRedisUrl = (redisUrl: string) => {
  const parsed = new URL(redisUrl);
  return {
    host: parsed.hostname || 'localhost',
    port: Number.parseInt(parsed.port || '6379', 10),
    password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
  };
};

/** Ejecuta uno o más comandos en serie sobre una conexión TCP efímera a Redis */
const runRedisCommands = async (
  redisUrl: string,
  commands: string[][]
): Promise<unknown[]> => {
  const { host, port, password } = parseRedisUrl(redisUrl);
  const allCommands = password ? [['AUTH', password], ...commands] : commands;

  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port });
    const chunks: Buffer[] = [];
    const results: unknown[] = [];
    let settled = false;

    const finish = (err?: unknown) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      if (err) reject(err);
      else resolve(password ? results.slice(1) : results);
    };

    socket.setTimeout(COMMAND_TIMEOUT_MS, () =>
      finish(new Error('Redis timeout'))
    );
    socket.on('error', finish);

    socket.on('connect', () => {
      socket.write(Buffer.concat(allCommands.map(encodeCommand)));
    });

    socket.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
      const buffer = Buffer.concat(chunks);
      let offset = 0;
      const parsedItems: unknown[] = [];

      while (parsedItems.length < allCommands.length) {
        const parsed = parseResp(buffer, offset);
        if (!parsed) return;
        if (parsed.value instanceof Error) {
          finish(parsed.value);
          return;
        }
        parsedItems.push(parsed.value);
        offset = parsed.nextOffset;
      }

      results.push(...parsedItems);
      finish();
    });
  });
};

/**
 * Cliente de caché Cache-Aside respaldado en Redis (con fallback automático a memoria
 * local cuando REDIS_URL no está definido o Redis no está disponible).
 */
export const createRedisCache = (redisUrl?: string): CacheStore => {
  const memory = new Map<string, MemoryEntry>();

  const memGet = <T>(key: string): T | null => {
    const entry = memory.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      memory.delete(key);
      return null;
    }
    try {
      return JSON.parse(entry.raw) as T;
    } catch {
      memory.delete(key);
      return null;
    }
  };

  const memSet = (key: string, raw: string, ttlSeconds: number) => {
    if (memory.size >= MEMORY_MAX_KEYS) memory.clear();
    memory.set(key, {
      raw,
      expiresAt: Date.now() + ttlSeconds * 1_000,
    });
  };

  return {
    async get<T>(key: string): Promise<T | null> {
      if (redisUrl) {
        try {
          const [raw] = await runRedisCommands(redisUrl, [['GET', key]]);
          if (typeof raw === 'string') {
            memSet(key, raw, 30);
            return JSON.parse(raw) as T;
          }
          memory.delete(key);
          return null;
        } catch {
          // Degradación elegante a memoria si Redis no responde
        }
      }
      return memGet<T>(key);
    },

    async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
      const raw = JSON.stringify(value);
      memSet(key, raw, ttlSeconds);
      if (!redisUrl) return;
      try {
        await runRedisCommands(redisUrl, [
          ['SET', key, raw, 'EX', String(Math.max(1, Math.floor(ttlSeconds)))],
        ]);
      } catch {
        // Fallback silencioso a memoria
      }
    },

    async del(...keys: string[]): Promise<void> {
      const validKeys = keys.filter(Boolean);
      for (const key of validKeys) memory.delete(key);
      if (!redisUrl || validKeys.length === 0) return;
      try {
        await runRedisCommands(redisUrl, [['DEL', ...validKeys]]);
      } catch {
        // Fallback silencioso
      }
    },

    async delByPrefix(prefix: string): Promise<void> {
      for (const key of memory.keys()) {
        if (key.startsWith(prefix)) memory.delete(key);
      }
      if (!redisUrl) return;
      try {
        const [keys] = await runRedisCommands(redisUrl, [
          ['KEYS', `${prefix}*`],
        ]);
        if (Array.isArray(keys) && keys.length > 0) {
          const strKeys = keys.filter(
            (k): k is string => typeof k === 'string'
          );
          if (strKeys.length > 0) {
            await runRedisCommands(redisUrl, [['DEL', ...strKeys]]);
          }
        }
      } catch {
        // Fallback silencioso
      }
    },
  };
};

export const userProfileCacheKey = (userId: string) =>
  `kinal:user:profile:${userId}`;
