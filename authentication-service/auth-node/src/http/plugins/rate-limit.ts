import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import type { AppConfig } from '../../config/env.ts';
import { HttpResponseError } from './error-handler.ts';

const limitExceeded = (message: string, windowMs: number) =>
  new HttpResponseError(429, {
    success: false,
    message,
    retryAfter: Math.ceil(windowMs / 1000),
  });

/**
 * Límite general por IP: aplica a todas las rutas, incluidas las inexistentes.
 * Cabeceras estándar RateLimit-* (como express-rate-limit con standardHeaders).
 */
export const globalRateLimitPlugin = fp(
  async (app: FastifyInstance, { config }: { config: AppConfig }) => {
    const { windowMs, max } = config.rateLimit;
    await app.register(rateLimit, {
      global: true,
      max,
      timeWindow: windowMs,
      enableDraftSpec: true,
      errorResponseBuilder: () =>
        limitExceeded(
          'Demasiadas peticiones desde esta IP, intenta de nuevo más tarde.',
          windowMs
        ),
    });
  }
);

/**
 * Límite adicional para las rutas de autenticación (login, registro, correos).
 * Se registra en un contexto encapsulado: cuenta aparte y se suma al límite general.
 */
export const withAuthRateLimit =
  (config: AppConfig, routes: FastifyPluginAsync): FastifyPluginAsync =>
  async (app) => {
    const { authWindowMs, authMax } = config.rateLimit;
    await app.register(rateLimit, {
      global: true,
      max: authMax,
      timeWindow: authWindowMs,
      enableDraftSpec: true,
      onExceeded: (request) =>
        request.log.warn(
          `Rate limit exceeded for IP: ${request.ip} on ${request.url}`
        ),
      errorResponseBuilder: () =>
        limitExceeded(
          'Demasiados intentos de autenticación, intenta de nuevo más tarde.',
          authWindowMs
        ),
    });
    await app.register(routes);
  };
