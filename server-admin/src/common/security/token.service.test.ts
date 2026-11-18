import type { ConfigService } from '@nestjs/config';
import jwt from 'jsonwebtoken';
import { describe, expect, it, vi } from 'vitest';
import type { Env } from '../../config/env.validation.js';
import { TokenService } from './token.service.js';

const SECRET = 'una-clave-de-prueba-de-al-menos-256-bits!!';

const config = (values: Partial<Record<keyof Env, unknown>>) =>
  ({
    get: (key: string) => values[key as keyof Env],
  }) as unknown as ConfigService<Env, true>;

const service = (internalToken: string | undefined = 'interno-123') =>
  new TokenService(
    config({
      JWT_SECRET: SECRET,
      JWT_ISSUER: 'AuthService',
      JWT_AUDIENCE: 'AuthService',
      INTERNAL_SERVICE_TOKEN: internalToken,
    })
  );

const sign = (payload: object, options: jwt.SignOptions = {}) =>
  jwt.sign(payload, SECRET, {
    issuer: 'AuthService',
    audience: 'AuthService',
    expiresIn: '15m',
    ...options,
  });

describe('TokenService.verifyUser', () => {
  it('devuelve el usuario y su rol desde el JWT de auth', () => {
    const user = service().verifyUser(
      sign({ sub: 'usr_1', role: 'ADMIN_ROLE', jti: 'j1' })
    );

    expect(user).toMatchObject({ id: 'usr_1', role: 'ADMIN_ROLE', jti: 'j1' });
  });

  it('usa USER_ROLE si el token no trae rol', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(service().verifyUser(sign({ sub: 'usr_1' })).role).toBe('USER_ROLE');
  });

  it.each([
    ['otro emisor', sign({ sub: 'u' }, { issuer: 'Otro' })],
    ['otra audiencia', sign({ sub: 'u' }, { audience: 'Otra' })],
    [
      'otra firma',
      jwt.sign({ sub: 'u' }, 'otra-clave-cualquiera-de-32-caracteres'),
    ],
    // Un token sin firma ("alg": "none") nunca se acepta
    ['sin firma', jwt.sign({ sub: 'u' }, '', { algorithm: 'none' })],
  ])('rechaza un token con %s', (_case, token) => {
    expect(() => service().verifyUser(token)).toThrow();
  });

  it('rechaza un token vencido con TokenExpiredError', () => {
    const expired = jwt.sign(
      { sub: 'u', exp: Math.floor(Date.now() / 1000) - 10 },
      SECRET,
      { issuer: 'AuthService', audience: 'AuthService' }
    );

    expect(() => service().verifyUser(expired)).toThrow(
      expect.objectContaining({ name: 'TokenExpiredError' })
    );
  });
});

describe('TokenService.isValidInternalToken', () => {
  it('acepta solo el token interno exacto', () => {
    const tokens = service();
    expect(tokens.isValidInternalToken('interno-123')).toBe(true);
    expect(tokens.isValidInternalToken('interno-124')).toBe(false);
    expect(tokens.isValidInternalToken('interno')).toBe(false);
    expect(tokens.isValidInternalToken(undefined)).toBe(false);
  });

  it('rechaza todo si el servicio no tiene token interno configurado', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(service(undefined).isValidInternalToken('')).toBe(false);
    expect(service(undefined).isValidInternalToken('algo')).toBe(false);
  });
});
