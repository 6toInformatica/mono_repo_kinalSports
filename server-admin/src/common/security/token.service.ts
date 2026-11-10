import { timingSafeEqual } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import jwt, { type JwtPayload, type VerifyOptions } from 'jsonwebtoken';
import type { Env } from '../../config/env.validation.js';
import { USER_ROLE, type AuthenticatedUser } from './authenticated-user.js';

/**
 * Verificación de tokens: el JWT de los servicios de auth (HS256, mismo secreto,
 * emisor y audiencia) y el token interno entre servicios.
 */
@Injectable()
export class TokenService {
  readonly #secret: string;
  readonly #verifyOptions: VerifyOptions;
  readonly #internalToken: string | undefined;

  constructor(config: ConfigService<Env, true>) {
    this.#secret = config.get('JWT_SECRET', { infer: true });
    const issuer = config.get('JWT_ISSUER', { infer: true });
    const audience = config.get('JWT_AUDIENCE', { infer: true });
    this.#verifyOptions = {
      algorithms: ['HS256'],
      ...(issuer && { issuer }),
      ...(audience && { audience }),
    };
    this.#internalToken = config.get('INTERNAL_SERVICE_TOKEN', {
      infer: true,
    });
  }

  /** Token de la cabecera x-token o Authorization: Bearer */
  extractToken(req: Request) {
    return (
      req.header('x-token') ||
      req.header('Authorization')?.replace('Bearer ', '') ||
      undefined
    );
  }

  /** Lanza los errores de jsonwebtoken (TokenExpiredError, JsonWebTokenError) */
  verifyUser(token: string): AuthenticatedUser {
    const decoded = jwt.verify(
      token,
      this.#secret,
      this.#verifyOptions
    ) as JwtPayload;

    if (!decoded.role) {
      console.warn(`Token sin campo role para usuario ${decoded.sub}`);
    }

    return {
      id: String(decoded.sub),
      jti: decoded.jti,
      iat: decoded.iat,
      role: (decoded.role as string | undefined) || USER_ROLE,
    };
  }

  /** Compara en tiempo constante para evitar timing attacks */
  isValidInternalToken(received: string | undefined) {
    if (!this.#internalToken) {
      console.warn(
        'INTERNAL_SERVICE_TOKEN no está configurado en server-admin'
      );
    }
    if (!received || !this.#internalToken) return false;
    const a = Buffer.from(received);
    const b = Buffer.from(this.#internalToken);
    return a.length === b.length && timingSafeEqual(a, b);
  }
}
