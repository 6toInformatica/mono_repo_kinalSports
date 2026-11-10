import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import type { UploadedImage } from '../common/upload/image-upload.interceptor.js';
import type { Env } from '../config/env.validation.js';
import { CloudinaryService } from '../integrations/cloudinary.service.js';
import {
  DEFAULT_TOURNAMENT_LOGO,
  TOURNAMENT_MODEL,
  type Tournament,
} from './schemas/tournament.schema.js';

export interface ListTournamentsQuery {
  page?: string | number;
  limit?: string | number;
  isActive?: string;
  category?: string;
}

@Injectable()
export class TournamentService {
  readonly #folder: string;

  constructor(
    @InjectModel(TOURNAMENT_MODEL)
    private readonly tournaments: Model<Tournament>,
    private readonly images: CloudinaryService,
    config: ConfigService<Env, true>
  ) {
    this.#folder = config.get('CLOUDINARY_TOURNAMENTS_FOLDER', {
      infer: true,
    });
  }

  /** Torneos con paginación; por defecto solo los activos */
  async list({
    page = 1,
    limit = 10,
    isActive,
    category,
  }: ListTournamentsQuery) {
    const filter: Record<string, unknown> = {
      isActive: isActive === undefined ? true : isActive === 'true',
    };
    if (category) filter.category = category;

    const pageNumber = parseInt(String(page));
    const limitNumber = parseInt(String(limit));

    const [tournaments, total] = await Promise.all([
      this.tournaments
        .find(filter)
        .limit(limitNumber)
        .skip((pageNumber - 1) * limitNumber)
        .sort({ createdAt: -1 }),
      this.tournaments.countDocuments(filter),
    ]);

    return {
      tournaments,
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(total / limitNumber),
        totalRecords: total,
        limit: limitNumber,
      },
    };
  }

  findById(id: string) {
    return this.tournaments.findById(id);
  }

  async create(data: Record<string, unknown>, logo?: UploadedImage) {
    const tournament = new this.tournaments({
      ...data,
      logo: DEFAULT_TOURNAMENT_LOGO,
    });
    await tournament.validate();

    if (logo) {
      tournament.logo = (
        await this.images.upload(logo, this.#folder)
      ).secure_url;
    }

    try {
      await tournament.save();
    } catch (error) {
      if (logo) await this.#destroy(tournament.logo);
      throw error;
    }
    return tournament;
  }

  /** Si llega un logo nuevo, reemplaza al anterior (salvo el logo por defecto) */
  async update(
    id: string,
    data: Record<string, unknown>,
    logo?: UploadedImage
  ) {
    const current = await this.tournaments.findById(id);
    if (!current) return null;

    const changes = { ...data };
    if (logo) {
      changes.logo = (await this.images.upload(logo, this.#folder)).secure_url;
    }

    let updated;
    try {
      updated = await this.tournaments.findByIdAndUpdate(id, changes, {
        returnDocument: 'after',
        runValidators: true,
      });
    } catch (error) {
      if (typeof changes.logo === 'string') await this.#destroy(changes.logo);
      throw error;
    }

    if (logo && current.logo && current.logo !== DEFAULT_TOURNAMENT_LOGO) {
      await this.#destroy(current.logo);
    }
    return updated;
  }

  setActive(id: string, isActive: boolean) {
    return this.tournaments.findByIdAndUpdate(
      id,
      { isActive },
      { returnDocument: 'after' }
    );
  }

  delete(id: string) {
    return this.tournaments.findByIdAndDelete(id);
  }

  #destroy(url: string) {
    return this.images.destroy(this.images.publicIdFromUrl(url, this.#folder));
  }
}
