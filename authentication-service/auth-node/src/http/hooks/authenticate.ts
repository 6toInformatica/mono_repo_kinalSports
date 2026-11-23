import type { FastifyReply, FastifyRequest } from 'fastify';
import type { AppConfig } from '../../config/env.ts';
import type { TokenService } from '../../modules/auth/application/ports.ts';
import type { UserRepository } from '../../modules/users/application/ports.ts';
import { AUTH_COOKIE, readCookie } from '../cookies.ts';

interface SessionDeps {
  tokens: TokenService;
  users: UserRepository;
}

/**
 * Valida el access token (cabecera Authorization: Bearer, x-token o cookie httpOnly kinal_access)
 * y carga el usuario.
 */
export const authenticate =
  (config: AppConfig, { tokens, users }: SessionDeps) =>
  async (request: FastifyRequest, reply: FastifyReply) => {
    const header =
      request.headers['x-token'] ||
      request.headers.authorization ||
      readCookie(request, AUTH_COOKIE.access);

    if (!header) {
      return reply.code(401).send({
        success: false,
        message: 'No hay token en la petición',
      });
    }

    const token = String(header).replace(/^Bearer\s+/, '');

    try {
      const { sub } = await tokens.verifyAccessToken(token);
      const user = await users.findById(sub);

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
