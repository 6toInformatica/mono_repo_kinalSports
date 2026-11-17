import { describe, expect, it } from 'vitest';
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from '../../../../shared/domain/errors.ts';
import {
  aUser,
  fakeDeps,
  flushBackground,
  SECURE_TOKEN,
} from '../../../../test/fakes.ts';
import { makeVerifyEmail } from './verify-email.ts';

describe('verifyEmail', () => {
  it('activa la cuenta y envía el correo de bienvenida', async () => {
    const deps = fakeDeps();
    deps.users.findByEmailVerificationToken.mockResolvedValue(
      aUser({ emailVerification: { verified: false } })
    );

    const result = await makeVerifyEmail(deps)(SECURE_TOKEN);
    await flushBackground();

    expect(deps.users.markEmailAsVerified).toHaveBeenCalledWith(
      'usr_SeedUser0002'
    );
    expect(deps.emails.sendWelcome).toHaveBeenCalled();
    expect(result.data).toEqual({
      email: 'andrea.morales@kinalsports.gt',
      verified: true,
    });
  });

  it('rechaza tokens cortos sin consultar la base (401)', async () => {
    const deps = fakeDeps();

    await expect(makeVerifyEmail(deps)('corto')).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(deps.users.findByEmailVerificationToken).not.toHaveBeenCalled();
  });

  it('responde 404 si el token no corresponde a nadie', async () => {
    const deps = fakeDeps();
    deps.users.findByEmailVerificationToken.mockResolvedValue(null);

    await expect(makeVerifyEmail(deps)(SECURE_TOKEN)).rejects.toBeInstanceOf(
      NotFoundError
    );
  });

  it('responde 400 si el email ya estaba verificado', async () => {
    const deps = fakeDeps();
    deps.users.findByEmailVerificationToken.mockResolvedValue(aUser());

    await expect(makeVerifyEmail(deps)(SECURE_TOKEN)).rejects.toBeInstanceOf(
      BadRequestError
    );
    expect(deps.users.markEmailAsVerified).not.toHaveBeenCalled();
  });
});
