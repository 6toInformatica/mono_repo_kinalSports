import net from 'node:net';
import { describe, expect, it } from 'vitest';
import { createRedisCache, userProfileCacheKey } from './redis-cache.ts';

describe('createRedisCache (Cache-Aside)', () => {
  it('funciona con fallback en memoria cuando REDIS_URL no está definido', async () => {
    const cache = createRedisCache();
    const key = userProfileCacheKey('usr_1');

    expect(await cache.get(key)).toBeNull();
    await cache.set(key, { id: 'usr_1', username: 'ana' }, 60);
    expect(await cache.get(key)).toEqual({ id: 'usr_1', username: 'ana' });

    await cache.del(key);
    expect(await cache.get(key)).toBeNull();
  });

  it('habla protocolo RESP2 con un servidor Redis real por TCP e invalida por prefijo', async () => {
    const store = new Map<string, string>();
    const server = net.createServer((socket) => {
      socket.on('data', (data) => {
        const text = data.toString('utf8');
        if (text.includes('SET')) {
          const lines = text.split('\r\n');
          store.set(lines[4]!, lines[6]!);
          socket.write('+OK\r\n');
        } else if (text.includes('GET')) {
          const lines = text.split('\r\n');
          const val = store.get(lines[4]!);
          if (val === undefined) {
            socket.write('$-1\r\n');
          } else {
            socket.write(`$${Buffer.byteLength(val, 'utf8')}\r\n${val}\r\n`);
          }
        } else if (text.includes('KEYS')) {
          const keys = [...store.keys()];
          const resp = [
            `*${keys.length}\r\n`,
            ...keys.map((k) => `$${Buffer.byteLength(k, 'utf8')}\r\n${k}\r\n`),
          ].join('');
          socket.write(resp);
        } else if (text.includes('DEL')) {
          store.clear();
          socket.write(':1\r\n');
        }
      });
    });

    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', resolve)
    );
    const address = server.address() as net.AddressInfo;
    const cache = createRedisCache(`redis://127.0.0.1:${address.port}`);

    try {
      await cache.set(
        'kinal:user:profile:u1',
        { id: 'u1', name: 'Braulio' },
        60
      );
      expect(await cache.get('kinal:user:profile:u1')).toEqual({
        id: 'u1',
        name: 'Braulio',
      });

      await cache.delByPrefix('kinal:user:');
      expect(await cache.get('kinal:user:profile:u1')).toBeNull();
    } finally {
      server.close();
    }
  });
});
