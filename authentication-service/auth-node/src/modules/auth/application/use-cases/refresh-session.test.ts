import { describe, expect, it } from 'vitest';
import { aUser, fakeDeps } from '../../../../test/fakes.ts';
import { makeLogout, makeRefreshSession } from './refresh-session.ts';

const stored = (overrides = {}) => ({
  id: 'rt1',
  userId: 'usr_SeedUser0002',
  familyId: 'fam1',
  expiresAt: new Date(Date.now() + 60_000),
  revokedAt: null as Date | null,
  ...overrides,
});

describe('refreshSession', () => {
  it('rota el token: revoca el usado y emite otro en la misma familia', async () => {
    const deps = fakeDeps();
    deps.refreshTokens.findByRawToken.mockResolvedValue(stored());
    deps.users.findById.mockResolvedValue(aUser());
    deps.roles.getUserRoleNames.mockResolvedValue(['ADMIN_ROLE']);

    const result = await makeRefreshSession(deps)('raw');

    expect(deps.refreshTokens.revoke).toHaveBeenCalledWith('rt1');
    expect(deps.refreshTokens.issue).toHaveBeenCalledWith(
      'usr_SeedUser0002',
      'fam1'
    );
    // El rol se lee de la base, no del token anterior
    expect(deps.tokens.createAccessToken).toHaveBeenCalledWith(
      'usr_SeedUser0002',
      'ADMIN_ROLE'
    );
    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-nuevo',
      expiresIn: 900,
    });
  });

  it('rechaza un token desconocido', async () => {
    const deps = fakeDeps();
    deps.refreshTokens.findByRawToken.mockResolvedValue(null);

    await expect(makeRefreshSession(deps)('raw')).rejects.toThrow(
      'Refresh token inválido'
    );
  });

  it('revoca y rechaza un token expirado', async () => {
    const deps = fakeDeps();
    deps.refreshTokens.findByRawToken.mockResolvedValue(
      stored({ expiresAt: new Date(Date.now() - 1000) })
    );

    await expect(makeRefreshSession(deps)('raw')).rejects.toThrow('expirado');
    expect(deps.refreshTokens.revoke).toHaveBeenCalledWith('rt1');
    expect(deps.refreshTokens.issue).not.toHaveBeenCalled();
  });

  it('si se reutiliza un token revocado, revoca toda la familia', async () => {
    const deps = fakeDeps();
    deps.refreshTokens.findByRawToken.mockResolvedValue(
      stored({ revokedAt: new Date() })
    );

    await expect(makeRefreshSession(deps)('raw')).rejects.toThrow(
      'Sesión comprometida'
    );
    expect(deps.refreshTokens.revokeFamily).toHaveBeenCalledWith('fam1');
    expect(deps.refreshTokens.issue).not.toHaveBeenCalled();
  });

  it('no renueva la sesión de una cuenta desactivada', async () => {
    const deps = fakeDeps();
    deps.refreshTokens.findByRawToken.mockResolvedValue(stored());
    deps.users.findById.mockResolvedValue(aUser({ status: false }));

    await expect(makeRefreshSession(deps)('raw')).rejects.toThrow(
      'La cuenta está desactivada'
    );
    expect(deps.refreshTokens.issue).not.toHaveBeenCalled();
  });
});

describe('logout', () => {
  it('revoca el token activo', async () => {
    const deps = fakeDeps();
    deps.refreshTokens.findByRawToken.mockResolvedValue(stored());

    await makeLogout(deps)('raw');

    expect(deps.refreshTokens.revoke).toHaveBeenCalledWith('rt1');
  });

  it('no hace nada si el token no existe o ya estaba revocado', async () => {
    const deps = fakeDeps();
    deps.refreshTokens.findByRawToken
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(stored({ revokedAt: new Date() }));

    await makeLogout(deps)('raw');
    await makeLogout(deps)('raw');

    expect(deps.refreshTokens.revoke).not.toHaveBeenCalled();
  });
});
