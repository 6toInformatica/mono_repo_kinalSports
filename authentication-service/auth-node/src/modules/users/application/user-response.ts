import { USER_ROLE } from '../../roles/domain/roles.ts';
import type { User } from '../domain/user.ts';
import type { ImageStorage } from './ports.ts';

/** Representación pública del usuario (misma forma que UserResponseDto de .NET) */
export const createUserPresenter = (images: ImageStorage) => (user: User) => ({
  id: user.id,
  name: user.name,
  surname: user.surname,
  username: user.username,
  email: user.email,
  phone: user.profile?.phone || '',
  profilePicture: images.fullUrl(
    user.profile?.profilePicture || images.defaultAvatarPath()
  ),
  role: user.roles[0] ?? USER_ROLE,
  status: user.status,
  isEmailVerified: user.emailVerification?.verified ?? false,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export type UserPresenter = ReturnType<typeof createUserPresenter>;
export type UserResponse = ReturnType<UserPresenter>;
