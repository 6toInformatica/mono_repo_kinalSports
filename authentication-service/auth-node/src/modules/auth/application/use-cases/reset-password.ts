import {
  NotFoundError,
  UnauthorizedError,
} from '../../../../shared/domain/errors.ts';
import {
  inBackground,
  MIN_SECURE_TOKEN_LENGTH,
  type AuthDeps,
} from '../deps.ts';

/** Cambia la contraseña con el token del correo; cierra las sesiones abiertas */
export const makeResetPassword =
  ({
    users,
    passwords,
    emails,
  }: Pick<AuthDeps, 'users' | 'passwords' | 'emails'>) =>
  async (token: string, newPassword: string) => {
    if (!token || token.length < MIN_SECURE_TOKEN_LENGTH) {
      throw new UnauthorizedError('Token inválido para reset de contraseña');
    }

    const user = await users.findByPasswordResetToken(token);
    if (!user) {
      throw new NotFoundError('Usuario no encontrado o token inválido');
    }
    if (!user.passwordReset?.token) {
      throw new UnauthorizedError('Token de reset inválido o ya utilizado');
    }

    const passwordHash = await passwords.hash(newPassword);
    await users.updatePassword(user.id, passwordHash);

    inBackground('password changed', () =>
      emails.sendPasswordChanged(user.email, user.name)
    );

    return {
      success: true,
      message: 'Contraseña actualizada exitosamente',
      data: { email: user.email, reset: true },
    };
  };
