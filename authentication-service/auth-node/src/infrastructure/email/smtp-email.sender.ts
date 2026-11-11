import nodemailer from 'nodemailer';
import type { AppConfig } from '../../config/env.ts';
import type { EmailSender } from '../../modules/auth/application/ports.ts';

/**
 * Envío de correos por SMTP con las mismas plantillas que auth-service.
 * Sin credenciales SMTP el servicio arranca igual, pero cada envío falla.
 */
export const createSmtpEmailSender = (
  smtp: AppConfig['smtp'],
  frontendUrl: string
): EmailSender => {
  const transporter =
    smtp.username && smtp.password
      ? nodemailer.createTransport({
          host: smtp.host,
          port: smtp.port,
          secure: smtp.enableSsl,
          auth: { user: smtp.username, pass: smtp.password },
          // Evita que las peticiones queden colgadas si el SMTP no responde
          connectionTimeout: 10_000,
          greetingTimeout: 10_000,
          socketTimeout: 10_000,
          // Se acepta cualquier certificado del servidor SMTP (decisión vigente del proyecto)
          tls: { rejectUnauthorized: false },
        })
      : null;

  if (!transporter) {
    console.warn(
      'SMTP credentials not configured. Email functionality will not work.'
    );
  }

  const send = async (to: string, subject: string, html: string) => {
    if (!transporter) throw new Error('SMTP transporter not configured');
    await transporter.sendMail({
      from: `${smtp.fromName} <${smtp.fromEmail}>`,
      to,
      subject,
      html,
    });
  };

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
