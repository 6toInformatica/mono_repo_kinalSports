import { describe, expect, it, vi } from 'vitest';
import { aUser, fakeDeps } from '../../../../test/fakes.ts';
import { makeResendVerification } from './resend-verification.ts';

const pending = () => aUser({ emailVerification: { verified: false } });

describe('resendVerification', () => {
  it('genera un token nuevo y envía el correo', async () => {
    const deps = fakeDeps();
    deps.users.findByEmail.mockResolvedValue(pending());

    const { outcome, body } = await makeResendVerification(deps)(
      'ANDREA.MORALES@kinalsports.gt'
    );

    // El email se busca en minúsculas
    expect(deps.users.findByEmail).toHaveBeenCalledWith(
      'andrea.morales@kinalsports.gt'
    );
    expect(deps.users.setEmailVerificationToken).toHaveBeenCalled();
    expect(deps.emails.sendVerification).toHaveBeenCalled();
    expect(outcome).toBe('sent');
    expect(body.success).toBe(true);
  });

  it.each([
    ['user_not_found', null],
    ['already_verified', aUser()],
  ])('informa %s sin enviar nada', async (expected, user) => {
    const deps = fakeDeps();
    deps.users.findByEmail.mockResolvedValue(user);

    const { outcome } = await makeResendVerification(deps)('x@kinal.gt');

    expect(outcome).toBe(expected);
    expect(deps.emails.sendVerification).not.toHaveBeenCalled();
  });

  it('informa send_failed si el envío falla', async () => {
    const deps = fakeDeps();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    deps.users.findByEmail.mockResolvedValue(pending());
    deps.emails.sendVerification.mockRejectedValue(new Error('caído'));

    const { outcome, body } = await makeResendVerification(deps)('x@kinal.gt');

    expect(outcome).toBe('send_failed');
    expect(body.success).toBe(false);
  });

  it('informa error si falla la base', async () => {
    const deps = fakeDeps();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    deps.users.findByEmail.mockRejectedValue(new Error('db caída'));

    const { outcome } = await makeResendVerification(deps)('x@kinal.gt');

    expect(outcome).toBe('error');
  });
});
