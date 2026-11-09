import { randomBytes } from 'node:crypto';
import path from 'node:path';
import {
  deleteImage,
  uploadImage,
} from '../../../../helpers/cloudinary-service.js';
import { userRepository } from '../infrastructure/user.repository.ts';
import { buildUserResponse } from './user-response.ts';

const notFound = () =>
  Object.assign(new Error('Usuario no encontrado'), { status: 404 });

export const getUserProfile = async (userId: string) => {
  const user = await userRepository.findById(userId);
  if (!user) throw notFound();
  return buildUserResponse(user);
};

export const getUserProfileByUsername = async (username: string) => {
  const user = await userRepository.findByEmailOrUsername(username.trim());
  if (!user) throw notFound();
  return buildUserResponse(user);
};

/** Sube la nueva foto a Cloudinary, borra la anterior (si no es la de defecto) y la guarda */
export const updateProfilePicture = async (
  userId: string,
  filePath: string
) => {
  const user = await userRepository.findById(userId);
  if (!user) throw notFound();

  const ext = path.extname(filePath) || '.jpg';
  const cloudinaryFileName = `profile-${randomBytes(6).toString('hex')}${ext}`;
  const profilePicture = await uploadImage(filePath, cloudinaryFileName);

  const previousPicture = user.userProfile?.profilePicture ?? '';
  if (previousPicture && !previousPicture.includes('avatarDefault')) {
    await deleteImage(previousPicture);
  }

  await userRepository.updateProfilePicture(userId, profilePicture);
  return getUserProfile(userId);
};
