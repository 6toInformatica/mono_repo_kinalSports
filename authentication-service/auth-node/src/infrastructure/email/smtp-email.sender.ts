import nodemailer from 'nodemailer';
import type { AppConfig } from '../../config/env.ts';
import type { EmailSender } from '../../modules/auth/application/ports.ts';
import { createTemplatedEmailSender } from './templates.ts';

/**
 * Envío de correos por SMTP (lo usan las pruebas de contrato con Mailpit).
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

  return createTemplatedEmailSender(send, frontendUrl);
};
