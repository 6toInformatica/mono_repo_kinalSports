import { generateSecureToken } from '../../../../shared/domain/secure-token.ts';
import { EMAIL_VERIFICATION_TTL_MS, type AuthDeps } from '../deps.ts';

export type ResendOutcome =
  'sent' | 'user_not_found' | 'already_verified' | 'send_failed' | 'error';

const result = (
  outcome: ResendOutcome,
  success: boolean,
  message: string,
  data: Record<string, unknown>
) => ({ outcome, body: { success, message, data } });

/**
 * Genera un token nuevo y reenvía el correo de verificación. El envío es síncrono
 * para poder informar si falló. Devuelve el resultado y el cuerpo de la respuesta.
 */
export const makeResendVerification =
  ({ users, emails }: Pick<AuthDeps, 'users' | 'emails'>) =>
  async (email: string) => {
    try {
      const user = await users.findByEmail(email.toLowerCase());
      if (!user) {
        return result('user_not_found', false, 'Usuario no encontrado', {
          email,
          sent: false,
        });
      }

      if (user.emailVerification?.verified) {
        return result(
          'already_verified',
          false,
          'El email ya ha sido verificado',
          { email: user.email, verified: true }
        );
      }

      const token = generateSecureToken();
      await users.setEmailVerificationToken(
        user.id,
        token,
        new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS)
      );

      try {
        await emails.sendVerification(user.email, user.name, token);
        return result(
          'sent',
          true,
          'Email de verificación enviado exitosamente',
          { email: user.email, sent: true }
        );
      } catch (error) {
        console.error('Error sending verification email:', error);
        return result(
          'send_failed',
          false,
          'Error al enviar el email de verificación. Por favor, intenta nuevamente más tarde.',
          { email: user.email, sent: false }
        );
      }
    } catch (error) {
      console.error('Error en resendVerification:', error);
      return result('error', false, 'Error interno del servidor', {
        email,
        sent: false,
      });
    }
  };
