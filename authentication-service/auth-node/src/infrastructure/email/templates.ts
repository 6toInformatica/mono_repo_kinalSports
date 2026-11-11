import type { EmailSender } from '../../modules/auth/application/ports.ts';

/** Envía un correo ya armado; cada transporte (SMTP, Kinal Mail Hub) implementa esto. */
export type SendHtml = (
  to: string,
  subject: string,
  html: string
) => Promise<void>;

/** Plantillas de correo (las mismas que auth-service), independientes del transporte. */
export const createTemplatedEmailSender = (
  send: SendHtml,
  frontendUrl: string
): EmailSender => {
  return {
    sendVerification(email, name, token) {
      const url = `${frontendUrl}/verify-email?token=${token}`;
      return send(
        email,
        'Verifica tu correo electrónico - Kinal Sports',
        `
        <h2>¡Bienvenido a Kinal Sports, ${name}!</h2>
        <p>Por favor, verifica tu correo electrónico para tu cuenta de Kinal Sports haciendo clic en el siguiente enlace:</p>
        <a href='${url}' style='background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>
            Verificar correo
        </a>
        <p>Si no puedes hacer clic en el enlace, copia y pega esta URL en tu navegador:</p>
        <p>${url}</p>
        <p>Este enlace expirará en 24 horas.</p>
        <p>Si no creaste una cuenta, ignora este correo.</p>
      `
      );
    },

    sendPasswordReset(email, name, token) {
      const url = `${frontendUrl}/reset-password?token=${token}`;
      return send(
        email,
        'Restablece tu contraseña - Kinal Sports',
        `
        <h2>Solicitud de restablecimiento de contraseña - Kinal Sports</h2>
        <p>Hola ${name},</p>
        <p>Este mensaje es de Kinal Sports.</p>
        <p>Solicitaste restablecer tu contraseña. Haz clic en el siguiente enlace para restablecerla:</p>
        <a href='${url}' style='background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>
            Restablecer contraseña
        </a>
        <p>Si no puedes hacer clic en el enlace, copia y pega esta URL en tu navegador:</p>
        <p>${url}</p>
        <p>Este enlace expirará en 1 hora.</p>
        <p>Si no solicitaste esto, ignora este correo y tu contraseña permanecerá sin cambios.</p>
      `
      );
    },

    sendWelcome(email, name) {
      return send(
        email,
        '¡Bienvenido a Kinal Sports!',
        `
        <h2>¡Bienvenido a Kinal Sports, ${name}!</h2>
        <p>Tu cuenta ha sido verificada y activada exitosamente.</p>
        <p>Ahora puedes disfrutar de todas las funciones de nuestra plataforma.</p>
        <p>Si tienes alguna pregunta, no dudes en contactar a nuestro equipo de soporte.</p>
        <p>¡Gracias por unirte a nosotros!</p>
      `
      );
    },

    sendPasswordChanged(email, name) {
      return send(
        email,
        'Password Changed Successfully',
        `
        <h2>Password Changed</h2>
        <p>Hello ${name},</p>
        <p>Your password has been successfully updated.</p>
        <p>If you didn't make this change, please contact our support team immediately.</p>
        <p>This is an automated email, please do not reply to this message.</p>
      `
      );
    },
  };
};
