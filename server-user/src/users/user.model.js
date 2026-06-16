'use strict';

import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    authId: {
      type: String,
      required: [true, 'El ID de autenticación es requerido'],
      unique: true,
      index: true,
    },
    displayName: {
      type: String,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    favoriteSports: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export default mongoose.model('UserProfile', userSchema);
