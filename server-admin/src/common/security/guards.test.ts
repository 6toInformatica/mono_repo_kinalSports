import { type ExecutionContext, HttpException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthOrInternalGuard } from './auth-or-internal.guard.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import type { TokenService } from './token.service.js';

/** Contexto HTTP mínimo con los encabezados indicados */
const contextFor = (headers: Record<string, string> = {}) => {
  const req = {
    user: undefined as unknown,
    header: (name: string) => headers[name.toLowerCase()],
  };
  const context = {
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
  return { req, context };
};

const tokenError = (name: string) => Object.assign(new Error(name), { name });

const statusOf = (fn: () => unknown) => {
  try {
    fn();
  } catch (error) {
    const http = error as HttpException;
    return { status: http.getStatus(), body: http.getResponse() };
  }
  throw new Error('se esperaba un error');
};

let tokens: {
  extractToken: ReturnType<typeof vi.fn>;
  verifyUser: ReturnType<typeof vi.fn>;
  isValidInternalToken: ReturnType<typeof vi.fn>;
};
let jwtGuard: JwtAuthGuard;

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  tokens = {
    extractToken: vi.fn((req) => req.header('authorization')),
    verifyUser: vi.fn(() => ({ id: 'usr_1', role: 'USER_ROLE' })),
    isValidInternalToken: vi.fn((value) => value === 'interno-123'),
  };
  jwtGuard = new JwtAuthGuard(tokens as unknown as TokenService);
});

describe('JwtAuthGuard', () => {
  it('deja pasar un token válido y guarda el usuario en la petición', () => {
    const { req, context } = contextFor({ authorization: 'token' });

    expect(jwtGuard.canActivate(context)).toBe(true);
    expect(req.user).toEqual({ id: 'usr_1', role: 'USER_ROLE' });
  });

  it('responde 401 MISSING_TOKEN sin token', () => {
    const { context } = contextFor();

    expect(statusOf(() => jwtGuard.canActivate(context))).toMatchObject({
      status: 401,
      body: { error: 'MISSING_TOKEN' },
    });
  });

  it.each([
    ['TokenExpiredError', 401, 'TOKEN_EXPIRED'],
    ['JsonWebTokenError', 401, 'INVALID_TOKEN'],
    ['OtroError', 500, 'TOKEN_VALIDATION_ERROR'],
  ])('traduce %s a %i %s', (name, status, code) => {
    tokens.verifyUser.mockImplementation(() => {
      throw tokenError(name);
    });
    const { context } = contextFor({ authorization: 'token' });

    expect(statusOf(() => jwtGuard.canActivate(context))).toMatchObject({
      status,
      body: { success: false, error: code },
    });
  });
});

describe('AuthOrInternalGuard', () => {
  const guard = () =>
    new AuthOrInternalGuard(tokens as unknown as TokenService, jwtGuard);

  it('acepta el token interno entre servicios sin JWT', () => {
    const { req, context } = contextFor({ 'x-internal-token': 'interno-123' });

    expect(guard().canActivate(context)).toBe(true);
    expect(req.user).toEqual({ id: 'SYSTEM_USER', role: 'INTERNAL_SERVICE' });
    expect(tokens.verifyUser).not.toHaveBeenCalled();
  });

  it('con un token interno incorrecto exige el JWT', () => {
    const { context } = contextFor({ 'x-internal-token': 'falso' });

    expect(statusOf(() => guard().canActivate(context)).status).toBe(401);
  });

  it('acepta un usuario con JWT', () => {
    const { req, context } = contextFor({ authorization: 'token' });

    expect(guard().canActivate(context)).toBe(true);
    expect(req.user).toMatchObject({ id: 'usr_1' });
  });
});
