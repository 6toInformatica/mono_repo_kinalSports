import { Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import net from 'node:net';
import type { Env } from '../../config/env.validation.js';

interface MemoryEntry {
  raw: string;
  expiresAt: number;
}

const MEMORY_MAX_KEYS = 2_000;
const COMMAND_TIMEOUT_MS = 1_500;

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

const runRedisCommands = async (
  redisUrl: string,
  commands: string[][]
): Promise<unknown[]> => {
  const parsedUrl = new URL(redisUrl);
  const host = parsedUrl.hostname || 'localhost';
  const port = Number.parseInt(parsedUrl.port || '6379', 10);
  const password = parsedUrl.password
    ? decodeURIComponent(parsedUrl.password)
    : undefined;
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
 * Servicio de caché Cache-Aside respaldado en Redis con fallback en memoria.
 * Comparte espacio de llaves (`kinal:fields:*` y `kinal:user:profile:*`) con
 * `server-user`, `auth-node` y `auth-service`.
 */
@Injectable()
export class RedisCacheService {
  readonly #redisUrl: string | undefined;
  readonly #memory = new Map<string, MemoryEntry>();

  constructor(@Optional() config?: ConfigService<Env, true>) {
    this.#redisUrl =
      config?.get('REDIS_URL', { infer: true }) || process.env.REDIS_URL;
  }

  #memGet<T>(key: string): T | null {
    const entry = this.#memory.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.#memory.delete(key);
      return null;
    }
    try {
      return JSON.parse(entry.raw) as T;
    } catch {
      this.#memory.delete(key);
      return null;
    }
  }

  #memSet(key: string, raw: string, ttlSeconds: number) {
    if (this.#memory.size >= MEMORY_MAX_KEYS) this.#memory.clear();
    this.#memory.set(key, {
      raw,
      expiresAt: Date.now() + ttlSeconds * 1_000,
    });
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.#redisUrl) {
      try {
        const [raw] = await runRedisCommands(this.#redisUrl, [['GET', key]]);
        if (typeof raw === 'string') {
          this.#memSet(key, raw, 30);
          return JSON.parse(raw) as T;
        }
        this.#memory.delete(key);
        return null;
      } catch {
        // Fallback a memoria si Redis no responde
      }
    }
    return this.#memGet<T>(key);
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    const raw = JSON.stringify(value);
    this.#memSet(key, raw, ttlSeconds);
    if (!this.#redisUrl) return;
    try {
      await runRedisCommands(this.#redisUrl, [
        ['SET', key, raw, 'EX', String(Math.max(1, Math.floor(ttlSeconds)))],
      ]);
    } catch {
      // Fallback silencioso
    }
  }

  async del(...keys: string[]): Promise<void> {
    const validKeys = keys.filter(Boolean);
    for (const key of validKeys) this.#memory.delete(key);
    if (!this.#redisUrl || validKeys.length === 0) return;
    try {
      await runRedisCommands(this.#redisUrl, [['DEL', ...validKeys]]);
    } catch {
      // Fallback silencioso
    }
  }

  async delByPrefix(prefix: string): Promise<void> {
    for (const key of this.#memory.keys()) {
      if (key.startsWith(prefix)) this.#memory.delete(key);
    }
    if (!this.#redisUrl) return;
    try {
      const [keys] = await runRedisCommands(this.#redisUrl, [
        ['KEYS', `${prefix}*`],
      ]);
      if (Array.isArray(keys) && keys.length > 0) {
        const strKeys = keys.filter((k): k is string => typeof k === 'string');
        if (strKeys.length > 0) {
          await runRedisCommands(this.#redisUrl, [['DEL', ...strKeys]]);
        }
      }
    } catch {
      // Fallback silencioso
    }
  }
}
