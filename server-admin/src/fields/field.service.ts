import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import type { Model, QueryFilter } from 'mongoose';
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
}

@Injectable()
export class FieldService {
  readonly #folder: string;

  constructor(
    @InjectModel(FIELD_MODEL) private readonly fields: Model<Field>,
    private readonly images: CloudinaryService,
    config: ConfigService<Env, true>
  ) {
    this.#folder = config.get('CLOUDINARY_FOLDER', { infer: true });
  }

  /** Canchas con paginación (por defecto solo las activas) */
  async list({ page = 1, limit = 10, isActive = true }: ListFieldsQuery) {
    // isActive llega como texto desde la query; Mongoose lo convierte a booleano
    const filter = { isActive } as QueryFilter<Field>;
    const pageNumber = parseInt(String(page));
    const limitNumber = parseInt(String(limit));

    const [fields, total] = await Promise.all([
      this.fields
        .find(filter)
        .limit(limitNumber)
        .skip((pageNumber - 1) * limitNumber)
        .sort({ createdAt: -1 }),
      this.fields.countDocuments(filter),
    ]);

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

  findById(id: string) {
    return this.fields.findById(id);
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
      if (image) {
        await this.images.destroy(
          this.images.publicIdFromUrl(field.photo, this.#folder)
        );
      }
      throw error;
    }
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
      if (typeof changes.photo === 'string') {
        await this.images.destroy(
          this.images.publicIdFromUrl(changes.photo, this.#folder)
        );
      }
      throw error;
    }

    if (image && current.photo) {
      await this.images.destroy(
        this.images.publicIdFromUrl(current.photo, this.#folder)
      );
    }
    return updated;
  }

  setActive(id: string, isActive: boolean) {
    return this.fields.findByIdAndUpdate(
      id,
      { isActive },
      { returnDocument: 'after' }
    );
  }
}
