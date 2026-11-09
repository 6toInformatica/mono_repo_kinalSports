import type { FastifyReply, FastifyRequest } from 'fastify';
import {
  buildUserResponse,
  findUserById,
  getUserRoleNames,
  getUsersByRole as findUsersByRole,
  setUserSingleRole,
} from '../../legacy/index.ts';

export interface UserIdRoute {
  Params: { userId: string };
}
export interface UpdateRoleRoute extends UserIdRoute {
  Body: { roleName?: unknown } | undefined;
}
export interface RoleNameRoute {
  Params: { roleName: string };
}

const ADMIN_ROLE = 'ADMIN_ROLE';
const ALLOWED_ROLES = [ADMIN_ROLE, 'USER_ROLE'];

const normalizeRole = (roleName: unknown) =>
  (typeof roleName === 'string' ? roleName : '').trim().toUpperCase();

const isAdmin = async (request: FastifyRequest) => {
  if (!request.userId) return false;
  const roles =
    request.user?.UserRoles?.map((userRole) => userRole.Role?.Name).filter(
      Boolean
    ) ?? (await getUserRoleNames(request.userId));
  return roles.includes(ADMIN_ROLE);
};

const forbidden = (reply: FastifyReply) =>
  reply.code(403).send({ success: false, message: 'Forbidden' });

const roleNotAllowed = (reply: FastifyReply) =>
  reply.code(400).send({
    success: false,
    message: 'Role not allowed. Use ADMIN_ROLE or USER_ROLE',
  });

export const updateUserRole = async (
  request: FastifyRequest<UpdateRoleRoute>,
  reply: FastifyReply
) => {
  if (!(await isAdmin(request))) return forbidden(reply);

  const role = normalizeRole(request.body?.roleName);
  if (!ALLOWED_ROLES.includes(role)) return roleNotAllowed(reply);

  const user = await findUserById(request.params.userId);
  if (!user) {
    return reply.code(404).send({ success: false, message: 'User not found' });
  }

  const { updatedUser } = await setUserSingleRole(user, role);
  return reply.code(200).send(buildUserResponse(updatedUser));
};

export const getUserRoles = async (
  request: FastifyRequest<UserIdRoute>,
  reply: FastifyReply
) => reply.code(200).send(await getUserRoleNames(request.params.userId));

export const getUsersByRole = async (
  request: FastifyRequest<RoleNameRoute>,
  reply: FastifyReply
) => {
  if (!(await isAdmin(request))) return forbidden(reply);

  const role = normalizeRole(request.params.roleName);
  if (!ALLOWED_ROLES.includes(role)) return roleNotAllowed(reply);

  const users = await findUsersByRole(role);
  return reply.code(200).send(users.map(buildUserResponse));
};
