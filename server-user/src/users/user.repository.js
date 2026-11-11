'use strict';

import UserProfile from './user.model.js';

export const userProfileRepository = {
  findByAuthId(authId) {
    return UserProfile.findOne({ authId });
  },

  async create(authId) {
    const profile = new UserProfile({ authId });
    await profile.save();
    return profile;
  },

  /** Actualiza el perfil; si aún no existe, lo crea (upsert) */
  upsert(authId, data) {
    return UserProfile.findOneAndUpdate(
      { authId },
      { $set: data },
      {
        returnDocument: 'after',
        runValidators: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );
  },
};
