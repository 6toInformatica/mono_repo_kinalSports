import { Schema, type HydratedDocument, type Types } from 'mongoose';

export const TEAM_MODEL = 'Team';
export const DEFAULT_TEAM_LOGO = 'fields/kinal_sports_nyvxo5';
export const TEAM_CATEGORIES = ['FUTBOL_7', 'FUTBOL_11'] as const;

export interface Team {
  teamName: string;
  managerId: string;
  category: (typeof TEAM_CATEGORIES)[number];
  members: string[];
  namedMembers: Types.DocumentArray<{ _id: Types.ObjectId; name: string }>;
  logo: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type TeamDocument = HydratedDocument<Team>;

// Mismo esquema que usa server-user (colección compartida)
export const TeamSchema = new Schema<Team>(
  {
    teamName: {
      type: String,
      required: [true, 'El nombre del equipo es requerido'],
      trim: true,
    },
    managerId: {
      type: String,
      required: [true, 'El ID del manager es requerido'],
      trim: true,
    },
    category: {
      type: String,
      enum: TEAM_CATEGORIES,
      required: [true, 'La categoría del equipo es requerida'],
    },
    members: [{ type: String }],
    namedMembers: [{ name: { type: String, required: true, trim: true } }],
    logo: { type: String, default: DEFAULT_TEAM_LOGO },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
);

TeamSchema.index({ isActive: 1 });
