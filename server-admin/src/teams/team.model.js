'use strict';
import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema(
  {
    teamName: {
      type: String,
      required: [true, 'El nombre del equipo es requerido'],
      trim: true,
    },
    managerName: {
      type: String,
      trim: true,
      default: null,
    },
    category: {
      type: String,
      enum: ['FUTBOL_7', 'FUTBOL_11'],
      required: [true, 'La categoría del equipo es requerida'],
    },
    logo: {
      type: String,
      default: null,
    },
    uniformColor: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Índice para optimizar búsquedas
teamSchema.index({ isActive: 1 });

export default mongoose.model('Team', teamSchema);
