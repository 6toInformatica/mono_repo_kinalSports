'use strict';

import { redisCache } from '../infrastructure/redis.cache.js';
import { fieldRepository } from './field.repository.js';

const FIELDS_CACHE_PREFIX = 'kinal:fields:';
const FIELDS_CACHE_TTL_SECONDS = 120;
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

/** Campos con paginación y filtros opcionales (Cache-Aside en Redis compartido con server-admin) */
export const listFields = async (
  {
    page = 1,
    limit = 10,
    isActive = true,
    fieldType,
    capacity,
    maxPricePerHour,
    search,
  } = {},
  cache = process.env.REDIS_URL ? redisCache : null
) => {
  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);
  const activeKey = String(isActive) !== 'false';
  const extraFilterKey =
    fieldType || capacity || maxPricePerHour !== undefined || search
      ? `:${fieldType ?? ''}:${capacity ?? ''}:${maxPricePerHour ?? ''}:${search?.trim?.() ?? ''}`
      : '';
  const cacheKey = `${FIELDS_CACHE_PREFIX}page:${pageNumber}:${limitNumber}:${activeKey}${extraFilterKey}`;

  const cached = await cache?.get(cacheKey);
  if (cached) {
    return {
      fields: cached.fields,
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(cached.total / limitNumber),
        totalRecords: cached.total,
        limit: limitNumber,
      },
    };
  }

  const filter = { isActive };
  if (fieldType) filter.fieldType = String(fieldType).trim();
  if (capacity) filter.capacity = String(capacity).trim();
  if (maxPricePerHour !== undefined && maxPricePerHour !== '') {
    filter.pricePerHour = { $lte: Number(maxPricePerHour) };
  }
  if (typeof search === 'string' && search.trim()) {
    const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.fieldName = { $regex: escaped, $options: 'i' };
  }

  const { items, total } = await fieldRepository.findPage(filter, {
    skip: (pageNumber - 1) * limitNumber,
    limit: limitNumber,
  });

  await cache?.set(
    cacheKey,
    { fields: items, total },
    FIELDS_CACHE_TTL_SECONDS
  );

  return {
    fields: items,
    pagination: {
      currentPage: pageNumber,
      totalPages: Math.ceil(total / limitNumber),
      totalRecords: total,
      limit: limitNumber,
    },
  };
};

/** Campo por id, o null si no existe */
export const getField = async (
  id,
  cache = process.env.REDIS_URL ? redisCache : null
) => {
  const idStr = String(id ?? '');
  if (cache && OBJECT_ID_REGEX.test(idStr)) {
    const cacheKey = `${FIELDS_CACHE_PREFIX}id:${idStr}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;
    const field = await fieldRepository.findById(id);
    if (field) await cache.set(cacheKey, field, FIELDS_CACHE_TTL_SECONDS);
    return field;
  }
  return fieldRepository.findById(id);
};

/** true si la cancha existe y está activa (se puede reservar) */
export const isFieldAvailable = async (id) => {
  const field = await fieldRepository.findAvailability(id);
  return Boolean(field?.isActive);
};
