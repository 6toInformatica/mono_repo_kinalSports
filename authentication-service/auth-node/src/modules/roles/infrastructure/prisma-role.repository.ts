import type { PrismaClient } from '../../../infrastructure/database/prisma.ts';
import { generateId } from '../../../shared/domain/ids.ts';
import { ConflictError, NotFoundError } from '../../../shared/domain/errors.ts';
import { toDomainUser } from '../../users/infrastructure/prisma-user.repository.ts';
import type { RoleRepository } from '../application/ports.ts';
import { ADMIN_ROLE } from '../domain/roles.ts';

export class PrismaRoleRepository implements RoleRepository {
  readonly #db: PrismaClient;

  constructor(db: PrismaClient) {
    this.#db = db;
  }

  async getUserRoleNames(userId: string) {
    const userRoles = await this.#db.userRole.findMany({
      where: { userId },
      include: { role: true },
    });
    return userRoles.map((userRole) => userRole.role.name).filter(Boolean);
  }

  /** Usuarios con el rol; de sus roles solo se incluye esa asignación */
  async findUsersByRole(roleName: string) {
    const hasRole = { role: { name: roleName } };
    const records = await this.#db.user.findMany({
      where: { userRoles: { some: hasRole } },
      include: {
        userProfile: true,
        userEmail: true,
        userPasswordReset: true,
        userRoles: { where: hasRole, include: { role: true } },
      },
    });
    return records.map(toDomainUser);
  }

  /**
   * La transacción bloquea la fila del rol administrador: dos cambios simultáneos
   * no pueden dejar el sistema sin administradores.
   */
  async setUserSingleRole(userId: string, roleName: string) {
    await this.#db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM roles WHERE name = ${ADMIN_ROLE} FOR UPDATE`;

      const currentRoles = await tx.userRole.findMany({
        where: { userId },
        include: { role: true },
      });
      const isAdmin = currentRoles.some(
        (userRole) => userRole.role.name === ADMIN_ROLE
      );

      if (isAdmin && roleName !== ADMIN_ROLE) {
        const admins = await tx.userRole.findMany({
          where: { role: { name: ADMIN_ROLE } },
          distinct: ['userId'],
          select: { userId: true },
        });
        if (admins.length <= 1) {
          throw new ConflictError('Cannot remove the last administrator');
        }
      }

      const role = await tx.role.findUnique({ where: { name: roleName } });
      if (!role) throw new NotFoundError(`Role ${roleName} not found`);

      await tx.userRole.deleteMany({ where: { userId } });
      await tx.userRole.create({
        data: {
          id: generateId(),
          userId,
          roleId: role.id,
          createdAt: new Date(),
        },
      });
    });
  }

  async ensureRoles(names: readonly string[]) {
    for (const name of names) {
      const exists = await this.#db.role.findUnique({ where: { name } });
      if (exists) continue;
      try {
        await this.#db.role.create({
          data: { id: generateId(), name, createdAt: new Date() },
        });
      } catch (error) {
        // Otro servicio lo creó al mismo tiempo (índice único en name)
        if ((error as { code?: string }).code !== 'P2002') throw error;
      }
    }
  }
}
