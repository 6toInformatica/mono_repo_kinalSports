import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { BadRequestError, NotFoundError } from '../common/errors.js';
import type { UploadedImage } from '../common/upload/image-upload.interceptor.js';
import type { Env } from '../config/env.validation.js';
import { AuthClientService } from '../integrations/auth-client.service.js';
import { CloudinaryService } from '../integrations/cloudinary.service.js';
import {
  DEFAULT_TEAM_LOGO,
  TEAM_MODEL,
  type Team,
} from './schemas/team.schema.js';
import { ensureManagerInMembers, parseNamedMembers } from './team.rules.js';

export interface ListTeamsQuery {
  page?: string | number;
  limit?: string | number;
  isActive?: string;
  category?: string;
}

// Campos que no se cambian con la edición general del equipo
const PROTECTED_FIELDS = ['isActive', 'managerId', 'members'];

const MANAGER_NOT_FOUND =
  'El capitán seleccionado no existe o no tiene cuenta activa';

@Injectable()
export class TeamService {
  readonly #folder: string;

  constructor(
    @InjectModel(TEAM_MODEL) private readonly teams: Model<Team>,
    private readonly auth: AuthClientService,
    private readonly images: CloudinaryService,
    config: ConfigService<Env, true>
  ) {
    this.#folder = config.get('CLOUDINARY_TEAMS_FOLDER', { infer: true });
  }

  /** Equipos con paginación; por defecto solo los activos */
  async list({ page = 1, limit = 10, isActive, category }: ListTeamsQuery) {
    const filter: Record<string, unknown> = {
      isActive: isActive === undefined ? true : isActive === 'true',
    };
    if (category) filter.category = category;

    const pageNumber = parseInt(String(page));
    const limitNumber = parseInt(String(limit));

    const [teams, total] = await Promise.all([
      this.teams
        .find(filter)
        .limit(limitNumber)
        .skip((pageNumber - 1) * limitNumber)
        .sort({ createdAt: -1 }),
      this.teams.countDocuments(filter),
    ]);

    return {
      teams,
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(total / limitNumber),
        totalRecords: total,
        limit: limitNumber,
      },
    };
  }

  findById(id: string) {
    return this.teams.findById(id);
  }

  /** Solo el capitán (para autorizar la edición) */
  findManager(id: string) {
    return this.teams.findById(id).select('managerId');
  }

  /** El capitán debe tener una cuenta existente en el servicio de auth */
  async #assertManagerExists(managerId: unknown) {
    if (!(await this.auth.userExists(String(managerId)))) {
      throw new BadRequestError(MANAGER_NOT_FOUND);
    }
  }

  async create(data: Record<string, unknown>, logo?: UploadedImage) {
    await this.#assertManagerExists(data.managerId);

    const team = new this.teams({
      ...data,
      namedMembers: parseNamedMembers(data.namedMembers),
      members: data.managerId
        ? ensureManagerInMembers(
            String(data.managerId),
            (data.members as unknown[] | undefined) ?? []
          )
        : data.members,
      logo: DEFAULT_TEAM_LOGO,
    });
    await team.validate();

    if (logo)
      team.logo = (await this.images.upload(logo, this.#folder)).secure_url;

    try {
      await team.save();
    } catch (error) {
      if (logo) await this.#destroy(team.logo);
      throw error;
    }
    return team;
  }

  async update(
    id: string,
    data: Record<string, unknown>,
    logo?: UploadedImage
  ) {
    const current = await this.teams.findById(id);
    if (!current) return null;

    const changes = { ...data };
    for (const field of PROTECTED_FIELDS) delete changes[field];
    if (Object.hasOwn(changes, 'namedMembers')) {
      changes.namedMembers = parseNamedMembers(changes.namedMembers);
    }
    if (logo) {
      changes.logo = (await this.images.upload(logo, this.#folder)).secure_url;
    }

    let updated;
    try {
      updated = await this.teams.findByIdAndUpdate(id, changes, {
        returnDocument: 'after',
        runValidators: true,
      });
    } catch (error) {
      if (typeof changes.logo === 'string') await this.#destroy(changes.logo);
      throw error;
    }

    if (logo && current.logo) await this.#destroy(current.logo);
    return updated;
  }

  /** Cambia el capitán (solo admin); el nuevo capitán pasa a ser miembro */
  async changeManager(id: string, managerId: string) {
    await this.#assertManagerExists(managerId);

    const team = await this.teams.findById(id);
    if (!team) return null;

    team.managerId = managerId;
    team.members = ensureManagerInMembers(managerId, team.members);
    await team.save();
    return team;
  }

  setActive(id: string, isActive: boolean) {
    return this.teams.findByIdAndUpdate(
      id,
      { isActive },
      { returnDocument: 'after' }
    );
  }

  async addNamedMember(id: string, name: string) {
    const team = await this.teams.findById(id);
    if (!team) return null;

    team.namedMembers.push({ name: name.trim() });
    await team.save();
    return team;
  }

  async removeNamedMember(id: string, memberId: string) {
    const team = await this.teams.findById(id);
    if (!team) return null;

    const member = team.namedMembers.id(memberId);
    if (!member) throw new NotFoundError('Miembro del roster no encontrado');

    member.deleteOne();
    await team.save();
    return team;
  }

  #destroy(url: string) {
    return this.images.destroy(this.images.publicIdFromUrl(url, this.#folder));
  }
}
