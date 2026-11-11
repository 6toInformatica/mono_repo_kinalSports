import type { FastifyPluginAsync } from 'fastify';
import type { AppConfig } from '../../../../config/env.ts';
import type { Container } from '../../../../container.ts';
import { withAuthRateLimit } from '../../../../http/plugins/rate-limit.ts';
import { singleFileUpload } from '../../../../http/upload.ts';
import { validate } from '../../../../http/validation.ts';
import { createAuthHandlers } from './auth.handlers.ts';
import * as schemas from './auth.validation.ts';

/**
 * Rutas /auth de sesión y cuenta. Las de credenciales y correos tienen además
 * el límite de autenticación.
 */
export const authRoutes =
  (config: AppConfig, container: Container): FastifyPluginAsync =>
  async (app) => {
    const handlers = createAuthHandlers(container);

    app.post('/refresh', handlers.refresh);
    app.post('/logout', handlers.logout);
    app.post(
      '/verify-email',
      { preHandler: validate(schemas.verifyEmailSchema) },
      handlers.verifyEmail
    );

    await app.register(
      withAuthRateLimit(config, async (limited) => {
        limited.post(
          '/register',
          {
            preHandler: [
              singleFileUpload(config, 'profilePicture'),
              validate(schemas.registerSchema),
            ],
          },
          handlers.register
        );
        limited.post(
          '/login',
          { preHandler: validate(schemas.loginSchema) },
          handlers.login
        );
        limited.post(
          '/resend-verification',
          { preHandler: validate(schemas.resendVerificationSchema) },
          handlers.resendVerification
        );
        limited.post(
          '/forgot-password',
          { preHandler: validate(schemas.forgotPasswordSchema) },
          handlers.forgotPassword
        );
        limited.post(
          '/reset-password',
          { preHandler: validate(schemas.resetPasswordSchema) },
          handlers.resetPassword
        );
      })
    );
  };
