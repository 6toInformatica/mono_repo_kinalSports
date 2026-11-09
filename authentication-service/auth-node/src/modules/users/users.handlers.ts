import type { FastifyReply, FastifyRequest } from 'fastify';
import { ADMIN_ROLE, ALLOWED_ROLES } from '../roles/domain/roles.ts';
import { roleRepository } from '../roles/infrastructure/role.repository.ts';
import { buildUserResponse } from './application/user-response.ts';
import { userRepository } from './infrastructure/user.repository.ts';

export interface UserIdRoute {
  Params: { userId: string };
}
export interface UpdateRoleRoute extends UserIdRoute {
  Body: { roleName?: unknown } | undefined;
}
export interface RoleNameRoute {
  Params: { roleName: string };
}

const normalizeRole = (roleName: unknown) =>
  (typeof roleName === 'string' ? roleName : '').trim().toUpperCase();

const isAdmin = (request: FastifyRequest) =>
  request.user?.userRoles.some(
    (userRole) => userRole.role.name === ADMIN_ROLE
  ) ?? false;

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
  if (!isAdmin(request)) return forbidden(reply);

  const role = normalizeRole(request.body?.roleName);
  if (!ALLOWED_ROLES.includes(role)) return roleNotAllowed(reply);

  const user = await userRepository.findById(request.params.userId);
  if (!user) {
    return reply.code(404).send({ success: false, message: 'User not found' });
  }

  const { updatedUser } = await roleRepository.setUserSingleRole(user.id, role);
  return reply.code(200).send(buildUserResponse(updatedUser));
};

export const getUserRoles = async (
  request: FastifyRequest<UserIdRoute>,
  reply: FastifyReply
) =>
  reply
    .code(200)
    .send(await roleRepository.getUserRoleNames(request.params.userId));

export const getUsersByRole = async (
  request: FastifyRequest<RoleNameRoute>,
  reply: FastifyReply
) => {
  if (!isAdmin(request)) return forbidden(reply);

  const role = normalizeRole(request.params.roleName);
  if (!ALLOWED_ROLES.includes(role)) return roleNotAllowed(reply);

  const users = await roleRepository.getUsersByRole(role);
  return reply.code(200).send(users.map(buildUserResponse));
};
