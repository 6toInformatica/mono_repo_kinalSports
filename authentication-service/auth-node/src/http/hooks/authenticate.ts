import type { FastifyReply, FastifyRequest } from 'fastify';
import type { AppConfig } from '../../config/env.ts';
import { verifyJWT } from '../../../helpers/generate-jwt.js';
import { userRepository } from '../../modules/users/infrastructure/user.repository.ts';

/**
 * Valida el access token (cabecera Authorization: Bearer o x-token) y carga el usuario.
 * Solo por cabeceras: en el body o la query string el token puede quedar en logs.
 */
export const authenticate =
  (config: AppConfig) =>
  async (request: FastifyRequest, reply: FastifyReply) => {
    const header = request.headers['x-token'] || request.headers.authorization;

    if (!header) {
      return reply.code(401).send({
        success: false,
        message: 'No hay token en la petición',
      });
    }

    const token = String(header).replace(/^Bearer\s+/, '');

    try {
      const decoded = (await verifyJWT(token)) as { sub: string };
      const user = await userRepository.findById(decoded.sub);

      if (!user) {
        return reply.code(401).send({
          success: false,
          message: 'Token no válido - Usuario no existe',
        });
      }

      if (!user.status) {
        return reply.code(423).send({
          success: false,
          message: 'Cuenta desactivada. Contacta al administrador.',
        });
      }

      request.user = user;
      request.userId = user.id;
    } catch (error) {
      const { name, message: detail } = error as Error;
      request.log.warn({ err: error }, 'Error validating JWT');

      let message = 'Error al verificar el token';
      if (name === 'TokenExpiredError') message = 'Token expirado';
      else if (name === 'JsonWebTokenError') message = 'Token inválido';

      return reply.code(401).send({
        success: false,
        message,
        error: config.isDevelopment ? detail : undefined,
      });
    }
  };
