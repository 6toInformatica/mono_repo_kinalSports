import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from '../../../../shared/domain/errors.ts';
import {
  inBackground,
  MIN_SECURE_TOKEN_LENGTH,
  type AuthDeps,
} from '../deps.ts';

/** Verifica el email con el token del correo y activa la cuenta */
export const makeVerifyEmail =
  ({ users, emails }: Pick<AuthDeps, 'users' | 'emails'>) =>
  async (token: string) => {
    if (!token || token.length < MIN_SECURE_TOKEN_LENGTH) {
      throw new UnauthorizedError('Token inválido para verificación de email');
    }

    const user = await users.findByEmailVerificationToken(token);
    if (!user) {
      throw new NotFoundError('Usuario no encontrado o token inválido');
    }
    if (!user.emailVerification) {
      throw new NotFoundError('Registro de email no encontrado');
    }
    if (user.emailVerification.verified) {
      throw new BadRequestError('El email ya ha sido verificado');
    }

    await users.markEmailAsVerified(user.id);
    inBackground('welcome', () => emails.sendWelcome(user.email, user.name));

    return {
      success: true,
      message: 'Email verificado exitosamente. Ya puedes iniciar sesión.',
      data: { email: user.email, verified: true },
    };
  };
