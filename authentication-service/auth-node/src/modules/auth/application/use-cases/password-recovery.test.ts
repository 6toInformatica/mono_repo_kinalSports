import { describe, expect, it, vi } from 'vitest';
import {
  NotFoundError,
  UnauthorizedError,
} from '../../../../shared/domain/errors.ts';
import {
  aUser,
  fakeDeps,
  flushBackground,
  SECURE_TOKEN,
} from '../../../../test/fakes.ts';
import { makeForgotPassword } from './forgot-password.ts';
import { makeResetPassword } from './reset-password.ts';

describe('forgotPassword', () => {
  it('guarda un token de 1 hora y envía el enlace', async () => {
    const deps = fakeDeps();
    deps.users.findByEmail.mockResolvedValue(aUser());

    await makeForgotPassword(deps)('andrea.morales@kinalsports.gt');
    await flushBackground();

    const [, token, expiry] = deps.users.setPasswordResetToken.mock.calls[0]!;
    const minutes = ((expiry as Date).getTime() - Date.now()) / 6e4;
    expect(minutes).toBeGreaterThan(59);
    expect(minutes).toBeLessThanOrEqual(60);
    expect(deps.emails.sendPasswordReset).toHaveBeenCalledWith(
      'andrea.morales@kinalsports.gt',
      'Andrea',
      token
    );
  });

  it('responde lo mismo si el email no existe o falla la base', async () => {
    const deps = fakeDeps();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const forgot = makeForgotPassword(deps);

    deps.users.findByEmail.mockResolvedValueOnce(null);
    const missing = await forgot('nadie@kinal.gt');
    deps.users.findByEmail.mockRejectedValueOnce(new Error('db caída'));
    const failed = await forgot('nadie@kinal.gt');

    expect(missing).toEqual(failed);
    expect(missing.success).toBe(true);
    expect(deps.emails.sendPasswordReset).not.toHaveBeenCalled();
  });
});

describe('resetPassword', () => {
  const withToken = () => aUser({ passwordReset: { token: SECURE_TOKEN } });

  it('cambia la contraseña y avisa por correo', async () => {
    const deps = fakeDeps();
    deps.users.findByPasswordResetToken.mockResolvedValue(withToken());

    const result = await makeResetPassword(deps)(SECURE_TOKEN, 'Nueva12345!');
    await flushBackground();

    expect(deps.passwords.hash).toHaveBeenCalledWith('Nueva12345!');
    expect(deps.users.updatePassword).toHaveBeenCalledWith(
      'usr_SeedUser0002',
      'hash-nuevo'
    );
    expect(deps.emails.sendPasswordChanged).toHaveBeenCalled();
    expect(result.data.reset).toBe(true);
  });

  it('rechaza tokens cortos (401)', async () => {
    await expect(
      makeResetPassword(fakeDeps())('corto', 'Nueva12345!')
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('responde 404 si el token no corresponde a nadie', async () => {
    const deps = fakeDeps();
    deps.users.findByPasswordResetToken.mockResolvedValue(null);

    await expect(
      makeResetPassword(deps)(SECURE_TOKEN, 'Nueva12345!')
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('rechaza un token ya utilizado', async () => {
    const deps = fakeDeps();
    deps.users.findByPasswordResetToken.mockResolvedValue(aUser());

    await expect(
      makeResetPassword(deps)(SECURE_TOKEN, 'Nueva12345!')
    ).rejects.toThrow('ya utilizado');
    expect(deps.users.updatePassword).not.toHaveBeenCalled();
  });
});
