'use strict';

import net from 'node:net';
import { URL } from 'node:url';

const MEMORY_MAX_KEYS = 2_000;
const COMMAND_TIMEOUT_MS = 1_500;

const encodeCommand = (args) => {
  const chunks = [Buffer.from(`*${args.length}\r\n`, 'utf8')];
  for (const arg of args) {
    const buf = Buffer.from(String(arg), 'utf8');
    chunks.push(
      Buffer.from(`$${buf.length}\r\n`, 'utf8'),
      buf,
      Buffer.from('\r\n', 'utf8')
    );
  }
  return Buffer.concat(chunks);
};

const parseResp = (buf, offset = 0) => {
  if (offset >= buf.length) return undefined;
  const lineEnd = buf.indexOf('\r\n', offset);
  if (lineEnd === -1) return undefined;

  const prefix = String.fromCharCode(buf[offset]);
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
    const items = [];
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

const runRedisCommands = async (redisUrl, commands) => {
  const parsedUrl = new URL(redisUrl);
  const host = parsedUrl.hostname || 'localhost';
  const port = Number.parseInt(parsedUrl.port || '6379', 10);
  const password = parsedUrl.password
    ? decodeURIComponent(parsedUrl.password)
    : undefined;
  const allCommands = password ? [['AUTH', password], ...commands] : commands;

  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port });
    const chunks = [];
    const results = [];
    let settled = false;

    const finish = (err) => {
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
    socket.on('data', (chunk) => {
      chunks.push(chunk);
      const buffer = Buffer.concat(chunks);
      let offset = 0;
      const parsedItems = [];

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
 * Crea un cliente de caché Cache-Aside respaldado en Redis con fallback en memoria.
 */
export const createRedisCache = (redisUrl = process.env.REDIS_URL) => {
  const memory = new Map();

  const memGet = (key) => {
    const entry = memory.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      memory.delete(key);
      return null;
    }
    try {
      return JSON.parse(entry.raw);
    } catch {
      memory.delete(key);
      return null;
    }
  };

  const memSet = (key, raw, ttlSeconds) => {
    if (memory.size >= MEMORY_MAX_KEYS) memory.clear();
    memory.set(key, {
      raw,
      expiresAt: Date.now() + ttlSeconds * 1_000,
    });
  };

  return {
    async get(key) {
      const url = redisUrl ?? process.env.REDIS_URL;
      if (url) {
        try {
          const [raw] = await runRedisCommands(url, [['GET', key]]);
          if (typeof raw === 'string') {
            memSet(key, raw, 30);
            return JSON.parse(raw);
          }
          memory.delete(key);
          return null;
        } catch {
          // Fallback a memoria si Redis no responde
        }
      }
      return memGet(key);
    },

    async set(key, value, ttlSeconds) {
      const raw = JSON.stringify(value);
      memSet(key, raw, ttlSeconds);
      const url = redisUrl ?? process.env.REDIS_URL;
      if (!url) return;
      try {
        await runRedisCommands(url, [
          ['SET', key, raw, 'EX', String(Math.max(1, Math.floor(ttlSeconds)))],
        ]);
      } catch {
        // Fallback silencioso
      }
    },

    async del(...keys) {
      const validKeys = keys.filter(Boolean);
      for (const key of validKeys) memory.delete(key);
      const url = redisUrl ?? process.env.REDIS_URL;
      if (!url || validKeys.length === 0) return;
      try {
        await runRedisCommands(url, [['DEL', ...validKeys]]);
      } catch {
        // Fallback silencioso
      }
    },

    async delByPrefix(prefix) {
      for (const key of memory.keys()) {
        if (key.startsWith(prefix)) memory.delete(key);
      }
      const url = redisUrl ?? process.env.REDIS_URL;
      if (!url) return;
      try {
        const [keys] = await runRedisCommands(url, [['KEYS', `${prefix}*`]]);
        if (Array.isArray(keys) && keys.length > 0) {
          const strKeys = keys.filter((k) => typeof k === 'string');
          if (strKeys.length > 0) {
            await runRedisCommands(url, [['DEL', ...strKeys]]);
          }
        }
      } catch {
        // Fallback silencioso
      }
    },
  };
};

export const redisCache = createRedisCache();
