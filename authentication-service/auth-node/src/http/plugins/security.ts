import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import type { AppConfig } from '../../config/env.ts';

/**
 * CORS solo para los orígenes configurados (ALLOWED_ORIGINS), igual que auth-service.
 * Las apps móviles no envían Origin, así que no les afecta.
 */
export const securityPlugin = fp(
  async (app: FastifyInstance, { config }: { config: AppConfig }) => {
    await app.register(cors, {
      origin: [...config.cors.allowedOrigins],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    });

    await app.register(helmet, {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'blob:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          frameAncestors: ["'none'"],
        },
      },
      // HSTS desactivado: el servicio corre detrás de HTTP en desarrollo
      strictTransportSecurity: false,
      frameguard: { action: 'deny' },
      noSniff: true,
      hidePoweredBy: true,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginEmbedderPolicy: false,
    });
  }
);
