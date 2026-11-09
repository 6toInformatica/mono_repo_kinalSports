import { randomUUID } from 'node:crypto';
import jwt, { type SignOptions, type VerifyOptions } from 'jsonwebtoken';
import type { AppConfig } from '../../config/env.ts';
import type {
  AccessTokenClaims,
  TokenService,
} from '../../modules/auth/application/ports.ts';

const ACCESS_TOKEN_EXPIRES_IN = '15m';

/**
 * JWT HS256 con el mismo secreto, emisor, audiencia y claims que auth-service,
 * para que los tokens de ambos servicios sean intercambiables.
 */
export const createJwtTokenService = (
  jwtConfig: AppConfig['jwt']
): TokenService => ({
  createAccessToken(userId, role) {
    const payload = {
      sub: String(userId),
      jti: randomUUID(),
      iat: Math.floor(Date.now() / 1000),
      role,
    };
    const options: SignOptions = {
      algorithm: 'HS256',
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
      ...(jwtConfig.issuer && { issuer: jwtConfig.issuer }),
      ...(jwtConfig.audience && { audience: jwtConfig.audience }),
    };
    return new Promise((resolve, reject) => {
      jwt.sign(payload, jwtConfig.secret, options, (error, token) =>
        error || !token ? reject(error) : resolve(token)
      );
    });
  },

  verifyAccessToken(token) {
    const options: VerifyOptions = {
      algorithms: ['HS256'],
      ...(jwtConfig.issuer && { issuer: jwtConfig.issuer }),
      ...(jwtConfig.audience && { audience: jwtConfig.audience }),
    };
    return new Promise((resolve, reject) => {
      jwt.verify(token, jwtConfig.secret, options, (error, decoded) =>
        error ? reject(error) : resolve(decoded as AccessTokenClaims)
      );
    });
  },
});
