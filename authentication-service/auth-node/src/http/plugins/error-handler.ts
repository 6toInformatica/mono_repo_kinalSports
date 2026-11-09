import { randomUUID } from 'node:crypto';
import type { FastifyError, FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

/** Error que ya trae su respuesta HTTP completa (rate limit, subida de archivos...) */
export class HttpResponseError extends Error {
  readonly statusCode: number;
  readonly body: Record<string, unknown>;

  constructor(statusCode: number, body: Record<string, unknown>) {
    super(typeof body.message === 'string' ? body.message : 'Error');
    this.statusCode = statusCode;
    this.body = body;
  }
}

interface AppError extends Partial<FastifyError> {
  status?: number;
  errorCode?: string | null;
  traceId?: string;
}

/**
 * Formato estándar de errores: { success, message, errorCode, traceId, timestamp }.
 * Mismos status y mensajes que el manejador de Express anterior.
 */
const errorEnvelope = (
  message: string,
  error: AppError,
  errorCode: string | null = error.errorCode ?? null
) => ({
  success: false,
  message,
  errorCode,
  traceId: error.traceId ?? randomUUID(),
  timestamp: new Date().toISOString(),
});

export const errorHandlerPlugin = fp(async (app: FastifyInstance) => {
  app.setErrorHandler<AppError>((error, request, reply) => {
    if (error instanceof HttpResponseError) {
      return reply.code(error.statusCode).send(error.body);
    }

    request.log.error({ err: error }, 'Request failed');

    if (error.name === 'JsonWebTokenError') {
      return reply.code(401).send(errorEnvelope('Token inválido', error));
    }
    if (error.name === 'TokenExpiredError') {
      return reply.code(401).send(errorEnvelope('Token expirado', error));
    }

    // Errores con status propio: los de la lógica de negocio (`status`)
    // y los de Fastify, como un JSON mal formado (`statusCode`)
    const status = error.status ?? error.statusCode;
    if (status && status >= 400 && status < 600) {
      return reply
        .code(status)
        .send(
          errorEnvelope(
            error.message || 'Error del servidor',
            error,
            error.errorCode ?? null
          )
        );
    }

    return reply
      .code(500)
      .send(errorEnvelope('Error interno del servidor', error));
  });

  app.setNotFoundHandler(
    // Las rutas inexistentes también cuentan para el límite general
    { preHandler: app.rateLimit() },
    (request, reply) =>
      reply
        .code(404)
        .send(errorEnvelope(`Ruta ${request.url} no encontrada`, {}, null))
  );
});
