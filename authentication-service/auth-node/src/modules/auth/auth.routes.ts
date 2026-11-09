import type { FastifyPluginAsync } from 'fastify';
import type { AppConfig } from '../../config/env.ts';
import { authenticate } from '../../http/hooks/authenticate.ts';
import { requireInternalToken } from '../../http/hooks/internal-token.ts';
import { withAuthRateLimit } from '../../http/plugins/rate-limit.ts';
import { singleFileUpload } from '../../http/upload.ts';
import { validate } from '../../http/validation.ts';
import * as handlers from './auth.handlers.ts';
import * as schemas from './auth.validation.ts';

/** Rutas /auth. Las de credenciales y correos tienen además el límite de autenticación. */
export const authRoutes =
  (config: AppConfig): FastifyPluginAsync =>
  async (app) => {
    const requireUser = authenticate(config);
    const internalOnly = requireInternalToken(config);

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

    app.get('/profile', { preHandler: requireUser }, handlers.getProfile);
    app.post(
      '/profile/picture',
      { preHandler: [requireUser, singleFileUpload(config, 'profilePicture')] },
      handlers.updateProfilePicture
    );
    app.post(
      '/profile/picture/avatar',
      { preHandler: [requireUser, singleFileUpload(config, 'avatar')] },
      handlers.updateProfilePicture
    );

    // Solo para servicios internos (exponen email y teléfono)
    app.post(
      '/profile/by-id',
      { preHandler: internalOnly },
      handlers.getProfileById
    );
    app.post(
      '/profile/by-username',
      { preHandler: internalOnly },
      handlers.getProfileByUsername
    );
  };
