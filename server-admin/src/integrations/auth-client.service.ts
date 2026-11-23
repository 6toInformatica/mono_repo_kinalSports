import { Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisCacheService } from '../common/cache/redis-cache.service.js';
import type { Env } from '../config/env.validation.js';

/** Perfil público de un usuario según el servicio de auth */
export interface AuthUserProfile {
  id?: string;
  name?: string;
  surname?: string;
  username?: string;
  email?: string;
  phone?: string;
  profilePicture?: string;
  [key: string]: unknown;
}

const PROFILE_CACHE_TTL_MS = 60_000;
const PROFILE_CACHE_MAX = 1000;

/** Cliente del servicio de auth para consultas internas (x-internal-token) */
@Injectable()
export class AuthClientService {
  readonly #baseUrl: string;
  readonly #internalToken: string | undefined;
  readonly #redis: RedisCacheService | undefined;
  readonly #cache = new Map<
    string,
    { promise: Promise<AuthUserProfile | null>; expiresAt: number }
  >();

  constructor(
    config: ConfigService<Env, true>,
    @Optional() redis?: RedisCacheService
  ) {
    this.#baseUrl = config.get('AUTH_SERVICE_URL', { infer: true }) ?? '';
    this.#internalToken = config.get('INTERNAL_SERVICE_TOKEN', {
      infer: true,
    });
    this.#redis = redis;
  }

  /**
   * Perfil por id (con caché Cache-Aside en Redis/memoria de 60 s). Devuelve null si el
   * usuario no existe (404) y lanza el error si el servicio falla.
   */
  async getUserById(userId: string): Promise<AuthUserProfile | null> {
    const key = String(userId);
    const redisKey = `kinal:user:profile:${key}`;
    const cachedInRedis = await this.#redis?.get<AuthUserProfile>(redisKey);
    if (cachedInRedis) return cachedInRedis;

    const hit = this.#cache.get(key);
    if (hit && hit.expiresAt > Date.now()) return hit.promise;

    if (this.#cache.size >= PROFILE_CACHE_MAX) this.#cache.clear();

    const promise = this.#fetchUserById(key).then(
      async (user) => {
        if (!user) {
          this.#cache.delete(key);
          return null;
        }
        await this.#redis?.set(redisKey, user, 60);
        return user;
      },
      (error: unknown) => {
        this.#cache.delete(key);
        throw error;
      }
    );
    this.#cache.set(key, {
      promise,
      expiresAt: Date.now() + PROFILE_CACHE_TTL_MS,
    });
    return promise;
  }

  async #fetchUserById(userId: string): Promise<AuthUserProfile | null> {
    const response = await fetch(`${this.#baseUrl}/auth/profile/by-id`, {
      method: 'QUERY',
      headers: {
        'Content-Type': 'application/json',
        ...(this.#internalToken && { 'x-internal-token': this.#internalToken }),
      },
      body: JSON.stringify({ userId }),
      signal: AbortSignal.timeout(5_000),
    });

    if (response.status === 404) return null;

    const body = (await response.json().catch(() => ({}))) as {
      data?: AuthUserProfile;
      message?: string;
    };
    if (!response.ok) {
      const message = body.message ?? `HTTP ${response.status}`;
      console.error('Error al consultar usuario en auth-service:', message);
      throw new Error(message);
    }
    return body.data ?? null;
  }

  async userExists(userId: string) {
    return Boolean(await this.getUserById(userId));
  }
}
