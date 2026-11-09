import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import type { AppConfig } from '../../../../config/env.ts';
import type { Container } from '../../../../container.ts';
import { authenticate } from '../../../../http/hooks/authenticate.ts';
import { requireInternalToken } from '../../../../http/hooks/internal-token.ts';
import { singleFileUpload } from '../../../../http/upload.ts';

type Body = Record<string, unknown> | undefined;

const profileResponse = (data: unknown) => ({
  success: true,
  message: 'Perfil obtenido exitosamente',
  data,
});

/** Rutas de perfil (bajo /auth): el propio, la foto y las consultas internas */
export const profileRoutes =
  (config: AppConfig, container: Container): FastifyPluginAsync =>
  async (app) => {
    const { users } = container;
    const requireUser = authenticate(config, container.session);
    const internalOnly = requireInternalToken(config);

    app.get('/profile', { preHandler: requireUser }, async (request, reply) =>
      reply
        .code(200)
        .send(profileResponse(await users.getProfile(request.userId!)))
    );

    const updatePicture = async (
      request: FastifyRequest,
      reply: FastifyReply
    ) => {
      if (!request.uploadedFile) {
        return reply.code(400).send({
          success: false,
          message: 'No se ha proporcionado ninguna imagen',
        });
      }
      const user = await users.updateProfilePicture(
        request.userId!,
        request.uploadedFile.path
      );
      return reply.code(200).send({
        success: true,
        message: 'Foto de perfil actualizada exitosamente',
        data: user,
      });
    };

    app.post(
      '/profile/picture',
      { preHandler: [requireUser, singleFileUpload(config, 'profilePicture')] },
      updatePicture
    );
    app.post(
      '/profile/picture/avatar',
      { preHandler: [requireUser, singleFileUpload(config, 'avatar')] },
      updatePicture
    );

    // Solo para servicios internos (exponen email y teléfono)
    app.post(
      '/profile/by-id',
      { preHandler: internalOnly },
      async (request, reply) => {
        const userId = (request.body as Body)?.userId;
        if (!userId) {
          return reply
            .code(400)
            .send({ success: false, message: 'El userId es requerido' });
        }
        return reply
          .code(200)
          .send(profileResponse(await users.getProfile(String(userId))));
      }
    );

    app.post(
      '/profile/by-username',
      { preHandler: internalOnly },
      async (request, reply) => {
        const username = (request.body as Body)?.username;
        if (typeof username !== 'string' || !username.trim()) {
          return reply
            .code(400)
            .send({ success: false, message: 'El username es requerido' });
        }
        return reply
          .code(200)
          .send(profileResponse(await users.getProfileByUsername(username)));
      }
    );
  };
