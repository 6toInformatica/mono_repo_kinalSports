import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Container } from '../../../../container.ts';
import { isAppError } from '../../../../shared/domain/errors.ts';
import type { RegisterInput } from '../../application/use-cases/register-user.ts';
import type { ResendOutcome } from '../../application/use-cases/resend-verification.ts';

type Body = Record<string, unknown>;

// Igual que antes: si la petición no trae cuerpo, leerlo falla y responde 500
const bodyOf = (request: FastifyRequest) => request.body as Body;

/**
 * Error de un flujo de autenticación: { success, message, error }.
 * Los errores de negocio traen su status; cualquier otro usa el del flujo.
 */
const sendFlowError = (
  request: FastifyRequest,
  reply: FastifyReply,
  error: unknown,
  defaultStatus: number,
  fallback: string
) => {
  const status = isAppError(error) ? error.status : defaultStatus;
  const message = (error as Error).message ?? '';
  request.log.warn({ err: error }, fallback);
  return reply.code(status).send({
    success: false,
    message: message || fallback,
    error: message,
  });
};

const RESEND_STATUS: Record<ResendOutcome, number> = {
  sent: 200,
  user_not_found: 404,
  already_verified: 400,
  // No se pudo enviar el correo o falló algo interno
  send_failed: 503,
  error: 503,
};

export const createAuthHandlers = ({ auth }: Container) => ({
  async register(request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await auth.register({
        ...(bodyOf(request) as unknown as RegisterInput),
        profilePicture: request.uploadedFile?.path ?? null,
      });
      return reply.code(201).send(result);
    } catch (error) {
      return sendFlowError(request, reply, error, 400, 'Error en el registro');
    }
  },

  async login(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { emailOrUsername, password } = bodyOf(request);
      const result = await auth.login(
        String(emailOrUsername),
        String(password)
      );
      return reply.code(200).send(result);
    } catch (error) {
      return sendFlowError(request, reply, error, 401, 'Error en el login');
    }
  },

  async verifyEmail(request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await auth.verifyEmail(String(bodyOf(request).token));
      return reply.code(200).send(result);
    } catch (error) {
      return sendFlowError(
        request,
        reply,
        error,
        400,
        'Error en la verificación'
      );
    }
  },

  async resendVerification(request: FastifyRequest, reply: FastifyReply) {
    const { outcome, body } = await auth.resendVerification(
      String(bodyOf(request).email)
    );
    return reply.code(RESEND_STATUS[outcome]).send(body);
  },

  async forgotPassword(request: FastifyRequest, reply: FastifyReply) {
    const result = await auth.forgotPassword(String(bodyOf(request).email));
    return reply.code(200).send(result);
  },

  async resetPassword(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { token, newPassword } = bodyOf(request);
      const result = await auth.resetPassword(
        String(token),
        String(newPassword)
      );
      return reply.code(200).send(result);
    } catch (error) {
      return sendFlowError(
        request,
        reply,
        error,
        400,
        'Error al resetear contraseña'
      );
    }
  },

  async refresh(request: FastifyRequest, reply: FastifyReply) {
    const { refreshToken } = bodyOf(request);
    if (!refreshToken) {
      return reply.code(400).send({ message: 'Refresh token requerido' });
    }
    try {
      const session = await auth.refreshSession(String(refreshToken));
      return reply.code(200).send(session);
    } catch (error) {
      if (isAppError(error)) {
        return reply.code(error.status).send({ message: error.message });
      }
      throw error;
    }
  },

  async logout(request: FastifyRequest, reply: FastifyReply) {
    const { refreshToken } = bodyOf(request);
    if (!refreshToken) {
      return reply.code(400).send({ message: 'Refresh token requerido' });
    }
    await auth.logout(String(refreshToken));
    return reply.code(200).send({ message: 'Sesión cerrada' });
  },
});
