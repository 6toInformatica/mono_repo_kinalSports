'use strict';

import { getUserById } from '../src/auth/auth.service.js';

export const enrichUserProfile = async (profile) => {
  const profileData = profile?.toObject ? profile.toObject() : { ...profile };
  const authUser = await getUserById(profileData.authId);

  if (!authUser) {
    return profileData;
  }

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
