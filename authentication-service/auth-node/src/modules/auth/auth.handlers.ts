import type { FastifyReply, FastifyRequest } from 'fastify';
import { generateJWT } from '../../../helpers/generate-jwt.js';
import { USER_ROLE } from '../roles/domain/roles.ts';
import { roleRepository } from '../roles/infrastructure/role.repository.ts';
import {
  getUserProfile,
  getUserProfileByUsername,
  updateProfilePicture as updateProfilePictureFlow,
} from '../users/application/profile.service.ts';
import { userRepository } from '../users/infrastructure/user.repository.ts';
import {
  forgotPassword as forgotPasswordFlow,
  loginUser,
  registerUser,
  resendVerificationEmail,
  resetPassword as resetPasswordFlow,
  verifyEmail as verifyEmailFlow,
  type RegisterInput,
} from './application/auth.service.ts';
import { refreshTokenRepository } from './infrastructure/refresh-token.repository.ts';

type Body = Record<string, unknown>;
type Request = FastifyRequest;

// Igual que antes: si la petición no trae cuerpo, leerlo falla y responde 500
const bodyOf = (request: FastifyRequest) => request.body as Body;

const ACCESS_TOKEN_TTL = '15m';
const ACCESS_TOKEN_TTL_SECONDS = 900;

const messageOf = (error: unknown) => (error as Error).message ?? '';

/** Respuesta de error de los flujos de autenticación: { success, message, error } */
const sendFlowError = (
  reply: FastifyReply,
  status: number,
  error: unknown,
  fallback: string
) =>
  reply.code(status).send({
    success: false,
    message: messageOf(error) || fallback,
    error: messageOf(error),
  });

// Errores de token: "no encontrado" → 404, inválido o expirado → 401, otro → 400
const tokenErrorStatus = (message: string) => {
  if (message.includes('no encontrado')) return 404;
  if (message.includes('inválido') || message.includes('expirado')) return 401;
  return 400;
};

export const register = async (request: Request, reply: FastifyReply) => {
  try {
    const result = await registerUser({
      ...(bodyOf(request) as unknown as RegisterInput),
      profilePicture: request.uploadedFile?.path ?? null,
    });
    return reply.code(201).send(result);
  } catch (error) {
    request.log.error({ err: error }, 'Error in register');
    const message = messageOf(error);
    const conflict =
      message.includes('ya está registrado') ||
      message.includes('ya está en uso') ||
      message.includes('Ya existe un usuario');
    return sendFlowError(
      reply,
      conflict ? 409 : 400,
      error,
      'Error en el registro'
    );
  }
};

export const login = async (request: Request, reply: FastifyReply) => {
  try {
    const { emailOrUsername, password } = bodyOf(request);
    const result = await loginUser(String(emailOrUsername), String(password));
    return reply.code(200).send(result);
  } catch (error) {
    request.log.warn({ err: error }, 'Error in login');
    const message = messageOf(error);
    const locked =
      message.includes('bloqueada') || message.includes('desactivada');
    return sendFlowError(reply, locked ? 423 : 401, error, 'Error en el login');
  }
};

export const verifyEmail = async (request: Request, reply: FastifyReply) => {
  try {
    const result = await verifyEmailFlow(String(bodyOf(request).token));
    return reply.code(200).send(result);
  } catch (error) {
    request.log.warn({ err: error }, 'Error in verifyEmail');
    return sendFlowError(
      reply,
      tokenErrorStatus(messageOf(error)),
      error,
      'Error en la verificación'
    );
  }
};

export const resendVerification = async (
  request: Request,
  reply: FastifyReply
) => {
  const result = await resendVerificationEmail(String(bodyOf(request).email));
  if (result.success) return reply.code(200).send(result);

  if (result.message.includes('no encontrado'))
    return reply.code(404).send(result);
  if (result.message.includes('ya ha sido verificado')) {
    return reply.code(400).send(result);
  }
  // No se pudo enviar el correo
  return reply.code(503).send(result);
};

export const forgotPassword = async (request: Request, reply: FastifyReply) => {
  // Siempre responde éxito por seguridad, aunque el usuario no exista
  const result = await forgotPasswordFlow(String(bodyOf(request).email));
  if (!result.success && result.data?.initiated === false) {
    return reply.code(503).send(result);
  }
  return reply.code(200).send(result);
};

export const resetPassword = async (request: Request, reply: FastifyReply) => {
  try {
    const { token, newPassword } = bodyOf(request);
    const result = await resetPasswordFlow(String(token), String(newPassword));
    return reply.code(200).send(result);
  } catch (error) {
    request.log.warn({ err: error }, 'Error in resetPassword');
    return sendFlowError(
      reply,
      tokenErrorStatus(messageOf(error)),
      error,
      'Error al resetear contraseña'
    );
  }
};

// --- Perfil ---

const profileResponse = (data: unknown) => ({
  success: true,
  message: 'Perfil obtenido exitosamente',
  data,
});

export const getProfile = async (
  request: FastifyRequest,
  reply: FastifyReply
) =>
  reply.code(200).send(profileResponse(await getUserProfile(request.userId!)));

export const getProfileById = async (request: Request, reply: FastifyReply) => {
  const userId = bodyOf(request)?.userId;
  if (!userId) {
    return reply
      .code(400)
      .send({ success: false, message: 'El userId es requerido' });
  }
  return reply
    .code(200)
    .send(profileResponse(await getUserProfile(String(userId))));
};

export const getProfileByUsername = async (
  request: Request,
  reply: FastifyReply
) => {
  const username = bodyOf(request)?.username;
  if (typeof username !== 'string' || !username.trim()) {
    return reply
      .code(400)
      .send({ success: false, message: 'El username es requerido' });
  }
  return reply
    .code(200)
    .send(profileResponse(await getUserProfileByUsername(username)));
};

export const updateProfilePicture = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  if (!request.uploadedFile) {
    return reply.code(400).send({
      success: false,
      message: 'No se ha proporcionado ninguna imagen',
    });
  }

  const user = await updateProfilePictureFlow(
    request.userId!,
    request.uploadedFile.path
  );
  return reply.code(200).send({
    success: true,
    message: 'Foto de perfil actualizada exitosamente',
    data: user,
  });
};

// --- Refresh token (rotación con detección de reutilización) ---

export const refresh = async (request: Request, reply: FastifyReply) => {
  const { refreshToken } = bodyOf(request);
  if (!refreshToken) {
    return reply.code(400).send({ message: 'Refresh token requerido' });
  }

  const stored = await refreshTokenRepository.findByRawToken(
    String(refreshToken)
  );
  if (!stored) {
    return reply.code(401).send({ message: 'Refresh token inválido' });
  }

  if (stored.expiresAt < new Date()) {
    await refreshTokenRepository.revoke(stored.id);
    return reply.code(401).send({ message: 'Refresh token expirado' });
  }

  if (stored.revokedAt) {
    // Reutilización detectada: se revoca toda la familia
    await refreshTokenRepository.revokeFamily(stored.familyId);
    return reply
      .code(401)
      .send({ message: 'Sesión comprometida. Refresh token reutilizado.' });
  }

  await refreshTokenRepository.revoke(stored.id);

  // Un usuario desactivado no puede seguir renovando su sesión
  const { userId } = stored;
  const user = await userRepository.findStatus(userId);
  if (!user || !user.status) {
    return reply.code(401).send({ message: 'La cuenta está desactivada' });
  }

  // El rol se vuelve a leer de la base para que el token renovado conserve el claim role
  const [role = USER_ROLE] = await roleRepository.getUserRoleNames(userId);
  const accessToken = await generateJWT(
    userId,
    { role },
    { expiresIn: ACCESS_TOKEN_TTL }
  );
  const { raw: newRefreshToken } = await refreshTokenRepository.issue(
    userId,
    stored.familyId
  );

  return reply.code(200).send({
    accessToken,
    refreshToken: newRefreshToken,
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  });
};

export const logout = async (request: Request, reply: FastifyReply) => {
  const { refreshToken } = bodyOf(request);
  if (!refreshToken) {
    return reply.code(400).send({ message: 'Refresh token requerido' });
  }

  const stored = await refreshTokenRepository.findByRawToken(
    String(refreshToken)
  );
  if (stored && !stored.revokedAt) {
    await refreshTokenRepository.revoke(stored.id);
  }
  return reply.code(200).send({ message: 'Sesión cerrada' });
};
