import { generateSecureToken } from '../../../../shared/domain/secure-token.ts';
import { inBackground, PASSWORD_RESET_TTL_MS, type AuthDeps } from '../deps.ts';

/**
 * Envía el enlace de recuperación. Por seguridad la respuesta es siempre la misma,
 * exista o no el usuario, y los errores internos no se revelan.
 */
export const makeForgotPassword =
  ({ users, emails }: Pick<AuthDeps, 'users' | 'emails'>) =>
  async (email: string) => {
    try {
      const user = await users.findByEmail(email.toLowerCase());
      if (user) {
        const token = generateSecureToken();
        await users.setPasswordResetToken(
          user.id,
          token,
          new Date(Date.now() + PASSWORD_RESET_TTL_MS)
        );
        inBackground('password reset', () =>
          emails.sendPasswordReset(user.email, user.name, token)
        );
      }
    } catch (error) {
      console.error('Error en forgotPassword:', error);
    }

    return {
      success: true,
      message: 'Si el email existe, se ha enviado un enlace de recuperación',
      data: { email, initiated: true },
    };
  };
