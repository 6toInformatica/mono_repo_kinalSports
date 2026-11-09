import type { FastifyPluginAsync } from 'fastify';
import type { AppConfig } from '../../config/env.ts';
import { authenticate } from '../../http/hooks/authenticate.ts';
import * as handlers from './users.handlers.ts';

/** Rutas /users: consulta y cambio de roles (todas requieren sesión) */
export const usersRoutes =
  (config: AppConfig): FastifyPluginAsync =>
  async (app) => {
    app.addHook('preHandler', authenticate(config));

    app.put<handlers.UpdateRoleRoute>('/:userId/role', handlers.updateUserRole);
    app.get<handlers.UserIdRoute>('/:userId/roles', handlers.getUserRoles);
    app.get<handlers.RoleNameRoute>(
      '/by-role/:roleName',
      handlers.getUsersByRole
    );
  };
