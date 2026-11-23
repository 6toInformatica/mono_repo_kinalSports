'use strict';

import { describe, expect, it, vi } from 'vitest';
import { fieldRepository } from '../fields/field.repository.js';
import { listFields } from '../fields/field.service.js';
import { createRedisCache } from './redis.cache.js';

describe('createRedisCache + listFields Cache-Aside (server-user)', () => {
  it('sirve canchas desde caché e invalida por prefijo', async () => {
    const cache = createRedisCache('');
    const findPageSpy = vi
      .spyOn(fieldRepository, 'findPage')
      .mockResolvedValue({
        items: [
          { _id: '60d0fe4f5311236168a109ca', fieldName: 'Cancha Sintética' },
        ],
        total: 1,
      });

    const first = await listFields(
      { page: 1, limit: 10, isActive: true },
      cache
    );
    expect(first.fields).toHaveLength(1);
    expect(findPageSpy).toHaveBeenCalledTimes(1);

    const second = await listFields(
      { page: 1, limit: 10, isActive: true },
      cache
    );
    expect(second.fields).toHaveLength(1);
    expect(findPageSpy).toHaveBeenCalledTimes(1);

    await cache.delByPrefix('kinal:fields:');
    await listFields({ page: 1, limit: 10, isActive: true }, cache);
    expect(findPageSpy).toHaveBeenCalledTimes(2);

    await listFields(
      {
        page: 1,
        limit: 10,
        isActive: true,
        fieldType: 'SINTETICA',
        capacity: 'FUTBOL_7',
        maxPricePerHour: 200,
        search: 'Sintética',
      },
      cache
    );
    expect(findPageSpy).toHaveBeenLastCalledWith(
      {
        isActive: true,
        fieldType: 'SINTETICA',
        capacity: 'FUTBOL_7',
        pricePerHour: { $lte: 200 },
        fieldName: { $regex: 'Sintética', $options: 'i' },
      },
      { skip: 0, limit: 10 }
    );

    findPageSpy.mockRestore();
  });
});
