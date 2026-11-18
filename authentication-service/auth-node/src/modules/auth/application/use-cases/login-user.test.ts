import { describe, expect, it } from 'vitest';
import {
  LockedError,
  UnauthorizedError,
} from '../../../../shared/domain/errors.ts';
import { aUser, fakeDeps } from '../../../../test/fakes.ts';
import { makeLoginUser } from './login-user.ts';

describe('loginUser', () => {
  it('devuelve access token, refresh token y los datos del usuario', async () => {
    const deps = fakeDeps();
    deps.users.findByEmailOrUsername.mockResolvedValue(aUser());

    const result = await makeLoginUser(deps)('andrea.morales', 'Admin1234!');

    expect(deps.tokens.createAccessToken).toHaveBeenCalledWith(
      'usr_SeedUser0002',
      'USER_ROLE'
    );
    expect(result).toMatchObject({
      success: true,
      accessToken: 'access-token',
      refreshToken: 'refresh-nuevo',
      expiresIn: 900,
      userDetails: { username: 'andrea.morales', role: 'USER_ROLE' },
    });
  });

  it('usa USER_ROLE si el usuario no tiene rol', async () => {
    const deps = fakeDeps();
    deps.users.findByEmailOrUsername.mockResolvedValue(aUser({ roles: [] }));

    await makeLoginUser(deps)('andrea.morales', 'Admin1234!');

    expect(deps.tokens.createAccessToken).toHaveBeenCalledWith(
      expect.any(String),
      'USER_ROLE'
    );
  });

  it('rechaza un usuario inexistente sin revelar el motivo', async () => {
    const deps = fakeDeps();
    deps.users.findByEmailOrUsername.mockResolvedValue(null);

    await expect(makeLoginUser(deps)('nadie', 'x')).rejects.toThrow(
      new UnauthorizedError('Credenciales inválidas')
    );
  });

  it('rechaza una contraseña incorrecta con el mismo mensaje', async () => {
    const deps = fakeDeps();
    deps.users.findByEmailOrUsername.mockResolvedValue(aUser());
    deps.passwords.verify.mockResolvedValue(false);

    await expect(makeLoginUser(deps)('andrea.morales', 'mala')).rejects.toThrow(
      'Credenciales inválidas'
    );
    expect(deps.refreshTokens.issue).not.toHaveBeenCalled();
  });

  it('exige el email verificado', async () => {
    const deps = fakeDeps();
    deps.users.findByEmailOrUsername.mockResolvedValue(
      aUser({ emailVerification: { verified: false } })
    );

    await expect(
      makeLoginUser(deps)('andrea.morales', 'Admin1234!')
    ).rejects.toThrow(/verificar tu email/);
  });

  it('bloquea una cuenta desactivada (423)', async () => {
    const deps = fakeDeps();
    deps.users.findByEmailOrUsername.mockResolvedValue(
      aUser({ status: false })
    );

    const error = await makeLoginUser(deps)(
      'andrea.morales',
      'Admin1234!'
    ).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(LockedError);
    expect((error as LockedError).status).toBe(423);
  });
});
