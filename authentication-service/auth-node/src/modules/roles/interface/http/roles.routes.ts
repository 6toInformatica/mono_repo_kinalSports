import type { FastifyPluginAsync, FastifyReply } from 'fastify';
import type { AppConfig } from '../../../../config/env.ts';
import type { Container } from '../../../../container.ts';
import { authenticate } from '../../../../http/hooks/authenticate.ts';
import { isAdmin, normalizeRole } from '../../domain/roles.ts';

interface UserIdRoute {
  Params: { userId: string };
}
interface UpdateRoleRoute extends UserIdRoute {
  Body: { roleName?: unknown } | undefined;
}
interface RoleNameRoute {
  Params: { roleName: string };
}

const forbidden = (reply: FastifyReply) =>
  reply.code(403).send({ success: false, message: 'Forbidden' });

const roleNotAllowed = (reply: FastifyReply) =>
  reply.code(400).send({
    success: false,
    message: 'Role not allowed. Use ADMIN_ROLE or USER_ROLE',
  });

/** Rutas /users: consulta y cambio de roles (todas requieren sesión) */
export const rolesRoutes =
  (config: AppConfig, container: Container): FastifyPluginAsync =>
  async (app) => {
    const { roles } = container;
    app.addHook('preHandler', authenticate(config, container.session));

    app.put<UpdateRoleRoute>('/:userId/role', async (request, reply) => {
      if (!isAdmin(request.user?.roles ?? [])) return forbidden(reply);

      const role = normalizeRole(request.body?.roleName);
      if (!role) return roleNotAllowed(reply);

      const updated = await roles.changeUserRole(request.params.userId, role);
      if (!updated) {
        return reply
          .code(404)
          .send({ success: false, message: 'User not found' });
      }
      return reply.code(200).send(updated);
    });

    app.get<UserIdRoute>('/:userId/roles', async (request, reply) =>
      reply.code(200).send(await roles.getUserRoles(request.params.userId))
    );

    app.get<RoleNameRoute>('/by-role/:roleName', async (request, reply) => {
      if (!isAdmin(request.user?.roles ?? [])) return forbidden(reply);

      const role = normalizeRole(request.params.roleName);
      if (!role) return roleNotAllowed(reply);

      return reply.code(200).send(await roles.listUsersByRole(role));
    });
  };
