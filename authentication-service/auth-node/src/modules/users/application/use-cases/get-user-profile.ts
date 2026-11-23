import {
  userProfileCacheKey,
  type CacheStore,
} from '../../../../infrastructure/cache/redis-cache.ts';
import { NotFoundError } from '../../../../shared/domain/errors.ts';
import type { UserRepository } from '../ports.ts';
import type { UserPresenter } from '../user-response.ts';

const PROFILE_CACHE_TTL_SECONDS = 60;

interface Deps {
  users: UserRepository;
  present: UserPresenter;
  cache?: CacheStore;
}

/** Perfil por id (con caché Cache-Aside en Redis/memoria de 60 s) */
export const makeGetUserProfile =
  ({ users, present, cache }: Deps) =>
  async (userId: string) => {
    const cacheKey = userProfileCacheKey(userId);
    const cached = await cache?.get<ReturnType<UserPresenter>>(cacheKey);
    if (cached) return cached;

    const user = await users.findById(userId);
    if (!user) throw new NotFoundError('Usuario no encontrado');
    const presented = present(user);
    await cache?.set(cacheKey, presented, PROFILE_CACHE_TTL_SECONDS);
    return presented;
  };

/** Perfil por username o email (consulta interna entre servicios) */
export const makeGetUserProfileByUsername =
  ({ users, present }: Deps) =>
  async (username: string) => {
    const user = await users.findByEmailOrUsername(username.trim());
    if (!user) throw new NotFoundError('Usuario no encontrado');
    return present(user);
  };

/** Lista completa de usuarios (panel de administración, compatible con auth-service) */
export const makeListUsers =
  ({ users, present }: Deps) =>
  async () =>
    (await users.findAll()).map(present);
