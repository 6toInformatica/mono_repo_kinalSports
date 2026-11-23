import { Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import type { Model, QueryFilter } from 'mongoose';
import { RedisCacheService } from '../common/cache/redis-cache.service.js';
import type { UploadedImage } from '../common/upload/image-upload.interceptor.js';
import type { Env } from '../config/env.validation.js';
import { CloudinaryService } from '../integrations/cloudinary.service.js';
import {
  DEFAULT_FIELD_PHOTO,
  FIELD_MODEL,
  type Field,
} from './schemas/field.schema.js';

export interface ListFieldsQuery {
  page?: string | number;
  limit?: string | number;
  isActive?: string | boolean;
  fieldType?: string;
  capacity?: string;
  maxPricePerHour?: string | number;
  search?: string;
}

const FIELDS_CACHE_PREFIX = 'kinal:fields:';
const FIELDS_CACHE_TTL_SECONDS = 120;

@Injectable()
export class FieldService {
  readonly #folder: string;
  readonly #cache: RedisCacheService | undefined;

  constructor(
    @InjectModel(FIELD_MODEL) private readonly fields: Model<Field>,
    private readonly images: CloudinaryService,
    config: ConfigService<Env, true>,
    @Optional() cache?: RedisCacheService
  ) {
    this.#folder = config.get('CLOUDINARY_FOLDER', { infer: true });
    this.#cache = cache;
  }

  /** Canchas con paginación y filtros opcionales (Cache-Aside en Redis con invalidación al mutar) */
  async list({
    page = 1,
    limit = 10,
    isActive = true,
    fieldType,
    capacity,
    maxPricePerHour,
    search,
  }: ListFieldsQuery = {}) {
    // isActive llega como texto desde la query o booleano desde QUERY body
    const filter: Record<string, unknown> = { isActive };
    if (fieldType) filter.fieldType = String(fieldType).trim();
    if (capacity) filter.capacity = String(capacity).trim();
    if (maxPricePerHour !== undefined && maxPricePerHour !== '') {
      filter.pricePerHour = { $lte: Number(maxPricePerHour) };
    }
    if (typeof search === 'string' && search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.fieldName = { $regex: escaped, $options: 'i' };
    }

    const pageNumber = parseInt(String(page));
    const limitNumber = parseInt(String(limit));
    const activeKey = String(isActive) !== 'false';
    const extraFilterKey =
      fieldType || capacity || maxPricePerHour !== undefined || search
        ? `:${fieldType ?? ''}:${capacity ?? ''}:${maxPricePerHour ?? ''}:${search?.trim() ?? ''}`
        : '';
    const cacheKey = `${FIELDS_CACHE_PREFIX}page:${pageNumber}:${limitNumber}:${activeKey}${extraFilterKey}`;

    const cached = await this.#cache?.get<{
      fields: unknown[];
      total: number;
    }>(cacheKey);
    if (cached) {
      return {
        fields: cached.fields,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(cached.total / Number(limit)),
          totalRecords: cached.total,
          limit,
        },
      };
    }

    const mongoFilter = filter as QueryFilter<Field>;
    const [fields, total] = await Promise.all([
      this.fields
        .find(mongoFilter)
        .limit(limitNumber)
        .skip((pageNumber - 1) * limitNumber)
        .sort({ createdAt: -1 }),
      this.fields.countDocuments(mongoFilter),
    ]);

    await this.#cache?.set(
      cacheKey,
      { fields, total },
      FIELDS_CACHE_TTL_SECONDS
    );

    return {
      fields,
      // currentPage y limit se devuelven tal como llegaron (igual que antes)
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / Number(limit)),
        totalRecords: total,
        limit,
      },
    };
  }

  async findById(id: string) {
    const cacheKey = `${FIELDS_CACHE_PREFIX}id:${id}`;
    const cached = await this.#cache?.get<Field>(cacheKey);
    if (cached) return cached;

    const field = await this.fields.findById(id);
    if (field) {
      await this.#cache?.set(cacheKey, field, FIELDS_CACHE_TTL_SECONDS);
    }
    return field;
  }

  /** Crea la cancha; la imagen se sube solo si los datos son válidos */
  async create(data: Record<string, unknown>, image?: UploadedImage) {
    const field = new this.fields({ ...data, photo: DEFAULT_FIELD_PHOTO });
    await field.validate();

    if (image) {
      field.photo = (await this.images.upload(image, this.#folder)).secure_url;
    }

    try {
      await field.save();
    } catch (error) {
      // La imagen recién subida ya no se usa
      if (image) await this.images.destroyByUrl(field.photo);
      throw error;
    }
    await this.#cache?.delByPrefix(FIELDS_CACHE_PREFIX);
    return field;
  }

  /** Actualiza la cancha; si llega una imagen nueva, reemplaza la anterior */
  async update(
    id: string,
    data: Record<string, unknown>,
    image?: UploadedImage
  ) {
    const current = await this.fields.findById(id);
    if (!current) return null;

    const changes = { ...data };
    if (image) {
      changes.photo = (
        await this.images.upload(image, this.#folder)
      ).secure_url;
    }

    let updated;
    try {
      updated = await this.fields.findByIdAndUpdate(id, changes, {
        returnDocument: 'after',
        runValidators: true,
      });
    } catch (error) {
      // La imagen recién subida ya no se usa
      if (typeof changes.photo === 'string') {
        await this.images.destroyByUrl(changes.photo);
      }
      throw error;
    }

    // Reemplazada: se borra la anterior (la imagen por defecto no se toca)
    if (image) await this.images.destroyByUrl(current.photo);
    await this.#cache?.delByPrefix(FIELDS_CACHE_PREFIX);
    return updated;
  }

  async setActive(id: string, isActive: boolean) {
    const updated = await this.fields.findByIdAndUpdate(
      id,
      { isActive },
      { returnDocument: 'after' }
    );
    await this.#cache?.delByPrefix(FIELDS_CACHE_PREFIX);
    return updated;
  }
}
