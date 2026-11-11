import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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

/** Cliente del servicio de auth para consultas internas (x-internal-token) */
@Injectable()
export class AuthClientService {
  readonly #baseUrl: string;
  readonly #internalToken: string | undefined;

  constructor(config: ConfigService<Env, true>) {
    this.#baseUrl = config.get('AUTH_SERVICE_URL', { infer: true }) ?? '';
    this.#internalToken = config.get('INTERNAL_SERVICE_TOKEN', {
      infer: true,
    });
  }

  /**
   * Perfil por id. Devuelve null si el usuario no existe (404) y lanza el error
   * si el servicio falla, para que quien llama decida qué hacer.
   */
  async getUserById(userId: string): Promise<AuthUserProfile | null> {
    const response = await fetch(`${this.#baseUrl}/auth/profile/by-id`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.#internalToken && { 'x-internal-token': this.#internalToken }),
      },
      body: JSON.stringify({ userId }),
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
