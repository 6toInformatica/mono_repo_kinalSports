import Fastify, { type FastifyServerOptions } from 'fastify';
import type { AppConfig } from './config/env.ts';
import type { Container } from './container.ts';
import { bodyParsersPlugin } from './http/plugins/body-parsers.ts';
import { errorHandlerPlugin } from './http/plugins/error-handler.ts';
import { globalRateLimitPlugin } from './http/plugins/rate-limit.ts';
import { securityPlugin } from './http/plugins/security.ts';
import { authRoutes } from './modules/auth/interface/http/auth.routes.ts';
import { rolesRoutes } from './modules/roles/interface/http/roles.routes.ts';
import { profileRoutes } from './modules/users/interface/http/profile.routes.ts';

const loggerOptions = (config: AppConfig): FastifyServerOptions['logger'] =>
  config.isDevelopment
    ? {
        level: 'info',
        transport: {
          target: 'pino-pretty',
          options: {
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname',
            singleLine: true,
          },
        },
      }
    : { level: 'info' };

/** Construye la aplicación Fastify (sin escuchar en ningún puerto) */
export const buildApp = async (config: AppConfig, container: Container) => {
  const app = Fastify({
    logger: loggerOptions(config),
    // Detrás de un proxy (un salto), para que request.ip sea la IP real del cliente
    trustProxy: (_address, hop) => hop < 1,
    bodyLimit: 10 * 1024 * 1024,
  });

  app.decorateRequest('user', null);
  app.decorateRequest('userId', null);
  app.decorateRequest('uploadedFile', null);

  await app.register(securityPlugin, { config });
  await app.register(globalRateLimitPlugin, { config });
  await app.register(errorHandlerPlugin);
  await app.register(bodyParsersPlugin, { config });

  await app.register(
    async (api) => {
      await api.register(authRoutes(config, container), { prefix: '/auth' });
      await api.register(profileRoutes(config, container), {
        prefix: '/auth',
      });
      await api.register(rolesRoutes(config, container), { prefix: '/users' });

      api.get('/health', async () => ({
        status: 'Healthy',
        timestamp: new Date().toISOString(),
        service: 'KinalSports Authentication Service',
      }));
    },
    { prefix: config.basePath }
  );

  return app;
};
