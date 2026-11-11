import { Schema, type Types } from 'mongoose';
import { TEAM_MODEL } from '../../teams/schemas/team.schema.js';

export const TOURNAMENT_MODEL = 'Tournament';
export const DEFAULT_TOURNAMENT_LOGO = 'fields/kinal_sports_nyvxo5';
export const TOURNAMENT_CATEGORIES = ['FUTBOL_7', 'FUTBOL_11'] as const;
export const TOURNAMENT_STATUSES = [
  'PENDIENTE',
  'EN PROGRESO',
  'TERMINADO',
  'CANCELADO',
] as const;

export interface Tournament {
  tournamentsName: string;
  category: (typeof TOURNAMENT_CATEGORIES)[number];
  startDate: Date;
  endDate: Date;
  teams: Types.ObjectId[];
  status: (typeof TOURNAMENT_STATUSES)[number];
  isActive: boolean;
  description: string;
  logo: string;
  createdAt: Date;
  updatedAt: Date;
}

// Mismo esquema que usa server-user (colección compartida)
export const TournamentSchema = new Schema<Tournament>(
  {
    tournamentsName: {
      type: String,
      required: [true, 'El nombre del torneo es requerido'],
      trim: true,
    },
    category: {
      type: String,
      enum: TOURNAMENT_CATEGORIES,
      required: [true, 'La categoría del torneo es requerida'],
    },
    startDate: {
      type: Date,
      required: [true, 'La fecha de inicio es requerida'],
    },
    endDate: {
      type: Date,
      required: [true, 'La fecha de finalización es requerida'],
    },
    teams: [{ type: Schema.Types.ObjectId, ref: TEAM_MODEL }],
    status: {
      type: String,
      enum: TOURNAMENT_STATUSES,
      default: 'PENDIENTE',
    },
    isActive: { type: Boolean, default: true },
    description: { type: String, default: '' },
    logo: { type: String, default: DEFAULT_TOURNAMENT_LOGO },
  },
  { timestamps: true, versionKey: false }
);

TournamentSchema.index({ category: 1 });
TournamentSchema.index({ status: 1 });
TournamentSchema.index({ isActive: 1 });
