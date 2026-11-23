import {
  userProfileCacheKey,
  type CacheStore,
} from '../../../../infrastructure/cache/redis-cache.ts';
import type { UserRepository } from '../../../users/application/ports.ts';
import type { UserPresenter } from '../../../users/application/user-response.ts';
import type { RoleRepository } from '../ports.ts';

interface Deps {
  users: UserRepository;
  roles: RoleRepository;
  present: UserPresenter;
  cache?: CacheStore;
}

/**
 * Asigna un único rol (ya validado) al usuario. Devuelve null si el usuario no existe.
 * El repositorio lanza ConflictError si se intenta quitar al último administrador.
 */
export const makeChangeUserRole =
  ({ users, roles, present, cache }: Deps) =>
  async (userId: string, role: string) => {
    const user = await users.findById(userId);
    if (!user) return null;

    await roles.setUserSingleRole(user.id, role);
    await cache?.del(userProfileCacheKey(user.id));

    const updated = await users.findById(user.id);
    return updated && present(updated);
  };
