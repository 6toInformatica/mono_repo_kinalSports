import type { ExecutionContext } from '@nestjs/common';
import { HttpException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RolesGuard } from './roles.js';

const contextFor = (user?: { role: string }) =>
  ({
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  }) as unknown as ExecutionContext;

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [RolesGuard, Reflector],
    }).compile();
    guard = moduleRef.get(RolesGuard);
    reflector = moduleRef.get(Reflector);
  });

  const allow = (roles?: string[]) =>
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(roles);

  it('deja pasar si la ruta no exige roles', () => {
    allow(undefined);
    expect(guard.canActivate(contextFor())).toBe(true);
  });

  it('deja pasar a un usuario con el rol requerido', () => {
    allow(['ADMIN_ROLE']);
    expect(guard.canActivate(contextFor({ role: 'ADMIN_ROLE' }))).toBe(true);
  });

  it('responde 403 si el rol no está permitido', () => {
    allow(['ADMIN_ROLE']);
    try {
      guard.canActivate(contextFor({ role: 'USER_ROLE' }));
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(403);
    }
  });

  it('responde 401 si no hay usuario autenticado', () => {
    allow(['ADMIN_ROLE']);
    expect(() => guard.canActivate(contextFor())).toThrow(HttpException);
  });
});
