'use strict';

import {
  getUserById,
  uploadProfilePicture,
} from '../infrastructure/auth.client.js';
import { userProfileRepository } from './user.repository.js';

/** Perfil local del usuario; si aún no existe, se crea */
const findOrCreateProfile = async (authId) =>
  (await userProfileRepository.findByAuthId(authId)) ??
  userProfileRepository.create(authId);

/**
 * Completa el perfil local con los datos de la cuenta en el servicio de auth
 * (nombre, username, email, foto). Si auth no responde, se devuelve el perfil tal cual.
 */
const enrichProfile = async (profile) => {
  const profileData = profile?.toObject ? profile.toObject() : { ...profile };
  const authUser = await getUserById(profileData.authId);
  if (!authUser) return profileData;

  const name = authUser.name ?? authUser.Name ?? '';
  const surname = authUser.surname ?? authUser.Surname ?? '';
  const fullName = `${name} ${surname}`.trim();
  const username = authUser.username ?? authUser.Username ?? '';
  const email = authUser.email ?? authUser.Email ?? '';
  const authPhone = authUser.phone ?? authUser.Phone ?? '';
  const profilePicture =
    authUser.profilePicture ?? authUser.ProfilePicture ?? '';

  profileData.name = name;
  profileData.surname = surname;
  profileData.username = username;
  profileData.email = email;
  profileData.profilePicture = profilePicture;
  profileData.avatar = profilePicture;

  if (!profileData.displayName?.trim()) {
    profileData.displayName = fullName || username;
  }
  if (!profileData.phone?.trim() && authPhone) {
    profileData.phone = authPhone;
  }

  return profileData;
};

export const getMyProfile = async (authId) =>
  enrichProfile(await findOrCreateProfile(authId));

export const updateMyProfile = async (
  authId,
  { displayName, phone, favoriteSports }
) =>
  enrichProfile(
    await userProfileRepository.upsert(authId, {
      displayName,
      phone,
      favoriteSports,
    })
  );

/**
 * La foto se guarda en el servicio de auth (con el token del usuario);
 * la respuesta es el perfil local con la foto nueva.
 */
export const updateAvatar = async (authId, file, authorizationHeader) => {
  const authUser = await uploadProfilePicture(file, authorizationHeader);
  const profile = await getMyProfile(authId);

  if (authUser?.profilePicture) {
    profile.profilePicture = authUser.profilePicture;
    profile.avatar = authUser.profilePicture;
  }

  return profile;
};
