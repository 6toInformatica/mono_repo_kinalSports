'use strict';

import UserProfile from './user.model.js';

/**
 * Obtener perfil por authId. Si no existe, lo crea automáticamente.
 */
export const findOrCreateProfile = async (authId) => {
  let profile = await UserProfile.findOne({ authId });

  if (!profile) {
    profile = new UserProfile({ authId });
    await profile.save();
  }

  return profile;
};

/**
 * Actualizar datos del perfil del usuario. Si aún no existe, lo crea (upsert).
 */
export const updateProfile = async (authId, updateData) => {
  return await UserProfile.findOneAndUpdate(
    { authId },
    { $set: updateData },
    { new: true, runValidators: true, upsert: true, setDefaultsOnInsert: true }
  );
};
