import {
  getDefaultAvatarPath,
  getFullImageUrl,
} from '../../../../helpers/cloudinary-service.js';
import { USER_ROLE } from '../../roles/domain/roles.ts';
import type { UserWithRelations } from '../infrastructure/user.repository.ts';

/** Representación pública del usuario (misma forma que UserResponseDto de .NET) */
export const buildUserResponse = (user: UserWithRelations) => ({
  id: user.id,
  name: user.name,
  surname: user.surname,
  username: user.username,
  email: user.email,
  phone: user.userProfile?.phone || '',
  profilePicture: getFullImageUrl(
    user.userProfile?.profilePicture || getDefaultAvatarPath()
  ),
  role: user.userRoles[0]?.role.name ?? USER_ROLE,
  status: user.status,
  isEmailVerified: user.userEmail?.emailVerified ?? false,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export type UserResponse = ReturnType<typeof buildUserResponse>;
