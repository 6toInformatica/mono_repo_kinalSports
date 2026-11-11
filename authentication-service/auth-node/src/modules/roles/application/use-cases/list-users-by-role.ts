import type { UserPresenter } from '../../../users/application/user-response.ts';
import type { RoleRepository } from '../ports.ts';

/** Usuarios que tienen el rol (ya validado) */
export const makeListUsersByRole =
  ({ roles, present }: { roles: RoleRepository; present: UserPresenter }) =>
  async (role: string) =>
    (await roles.findUsersByRole(role)).map(present);

/** Nombres de rol del usuario */
export const makeGetUserRoles =
  ({ roles }: { roles: RoleRepository }) =>
  (userId: string) =>
    roles.getUserRoleNames(userId);
