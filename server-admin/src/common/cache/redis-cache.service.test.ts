import { describe, expect, it, vi } from 'vitest';
import type { ConfigService } from '@nestjs/config';
import type { Model } from 'mongoose';
import type { Env } from '../../config/env.validation.js';
import { FieldService } from '../../fields/field.service.js';
import type { Field } from '../../fields/schemas/field.schema.js';
import type { CloudinaryService } from '../../integrations/cloudinary.service.js';
import { RedisCacheService } from './redis-cache.service.js';

describe('RedisCacheService + FieldService Cache-Aside', () => {
  it('sirve el listado de canchas desde caché e invalida al crear o editar', async () => {
    const cache = new RedisCacheService();
    const fakeField = {
      _id: '60d0fe4f5311236168a109ca',
      fieldName: 'Cancha 1',
    };

    const findChain = {
      limit: () => ({
        skip: () => ({
          sort: vi.fn().mockResolvedValue([fakeField]),
        }),
      }),
    };
    const countDocuments = vi.fn().mockResolvedValue(1);
    const findByIdAndUpdate = vi.fn().mockResolvedValue({
      ...fakeField,
      isActive: false,
    });

    const model = {
      find: vi.fn(() => findChain),
      countDocuments,
      findByIdAndUpdate,
    } as unknown as Model<Field>;

    const config = {
      get: () => 'kinal_sports/fields',
    } as unknown as ConfigService<Env, true>;

    const service = new FieldService(
      model,
      {} as CloudinaryService,
      config,
      cache
    );

    // 1. Primera consulta: va a MongoDB y guarda en caché
    const first = await service.list({ page: 1, limit: 10, isActive: true });
    expect(first.fields).toEqual([fakeField]);
    expect(countDocuments).toHaveBeenCalledTimes(1);

    // 2. Segunda consulta: sale de la caché sin consultar MongoDB
    const second = await service.list({ page: 1, limit: 10, isActive: true });
    expect(second.fields).toEqual([fakeField]);
    expect(countDocuments).toHaveBeenCalledTimes(1);

    // 3. Mutación (setActive): invalida kinal:fields:* automáticamente
    await service.setActive('60d0fe4f5311236168a109ca', false);

    // 4. Siguiente consulta vuelve a ir a MongoDB
    await service.list({ page: 1, limit: 10, isActive: true });
    expect(countDocuments).toHaveBeenCalledTimes(2);

    // 5. Consulta avanzada (QUERY /fields) con filtros estructurados en el body
    await service.list({
      page: 1,
      limit: 10,
      isActive: true,
      fieldType: 'SINTETICA',
      capacity: 'FUTBOL_7',
      maxPricePerHour: 250,
      search: 'Cancha',
    });
    expect(model.find).toHaveBeenLastCalledWith({
      isActive: true,
      fieldType: 'SINTETICA',
      capacity: 'FUTBOL_7',
      pricePerHour: { $lte: 250 },
      fieldName: { $regex: 'Cancha', $options: 'i' },
    });
  });
});
