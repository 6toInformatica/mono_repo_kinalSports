import type { User } from '../../users/domain/user.ts';

export interface RoleRepository {
  getUserRoleNames(userId: string): Promise<string[]>;
  findUsersByRole(roleName: string): Promise<User[]>;
  /**
   * Reemplaza los roles del usuario por uno solo, en una transacción que impide quitar
   * al último administrador. Lanza ConflictError o NotFoundError.
   */
  setUserSingleRole(userId: string, roleName: string): Promise<void>;
  /** Crea los roles que falten */
  ensureRoles(names: readonly string[]): Promise<void>;
}
