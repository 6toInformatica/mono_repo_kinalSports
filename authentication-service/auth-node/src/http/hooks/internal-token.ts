import { timingSafeEqual } from 'node:crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { AppConfig } from '../../config/env.ts';

/** Compara en tiempo constante para evitar timing attacks */
const sameToken = (
  received: string | undefined,
  expected: string | undefined
) => {
  if (!received || !expected) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
};

/**
 * Solo servicios internos (server-user / server-admin) con la cabecera x-internal-token.
 */
export const requireInternalToken =
  (config: AppConfig) =>
  async (request: FastifyRequest, reply: FastifyReply) => {
    const expected = config.internalServiceToken;
    if (!expected) {
      request.log.warn(
        'INTERNAL_SERVICE_TOKEN no está configurado en auth-node'
      );
    }

    const received = request.headers['x-internal-token'];
    if (
      sameToken(typeof received === 'string' ? received : undefined, expected)
    ) {
      return;
    }

    return reply.code(401).send({
      success: false,
      message: 'Acceso denegado: Token interno inválido o ausente',
    });
  };
