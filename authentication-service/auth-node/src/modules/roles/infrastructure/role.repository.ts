import { generateUserId } from '../../../../helpers/uuid-generator.js';
import { prisma } from '../../../infrastructure/database/prisma.ts';
import { userRepository } from '../../users/infrastructure/user.repository.ts';
import { ADMIN_ROLE, ALLOWED_ROLES } from '../domain/roles.ts';

/** Error con status HTTP (mismo formato que usaban los helpers anteriores) */
const httpError = (status: number, message: string) =>
  Object.assign(new Error(message), { status });

export const roleRepository = {
  async getUserRoleNames(userId: string) {
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });
    return userRoles.map((userRole) => userRole.role.name).filter(Boolean);
  },

  /** Usuarios que tienen el rol (solo se incluye esa asignación de rol) */
  getUsersByRole(roleName: string) {
    const hasRole = { role: { name: roleName } };
    return prisma.user.findMany({
      where: { userRoles: { some: hasRole } },
      include: {
        userProfile: true,
        userEmail: true,
        userPasswordReset: true,
        userRoles: { where: hasRole, include: { role: true } },
      },
    });
  },

  /**
   * Deja al usuario con un único rol. Todo ocurre en una transacción que bloquea la fila
   * del rol administrador, así dos cambios simultáneos no pueden dejar el sistema sin admins.
   */
  async setUserSingleRole(userId: string, roleName: string) {
    const normalized = roleName.trim().toUpperCase();
    if (!ALLOWED_ROLES.includes(normalized)) {
      throw httpError(400, 'Role not allowed. Use ADMIN_ROLE or USER_ROLE');
    }

    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM roles WHERE name = ${ADMIN_ROLE} FOR UPDATE`;

      const currentRoles = await tx.userRole.findMany({
        where: { userId },
        include: { role: true },
      });
      const isAdmin = currentRoles.some(
        (userRole) => userRole.role.name === ADMIN_ROLE
      );

      if (isAdmin && normalized !== ADMIN_ROLE) {
        const admins = await tx.userRole.findMany({
          where: { role: { name: ADMIN_ROLE } },
          distinct: ['userId'],
          select: { userId: true },
        });
        if (admins.length <= 1) {
          throw httpError(409, 'Cannot remove the last administrator');
        }
      }

      const role = await tx.role.findUnique({ where: { name: normalized } });
      if (!role) throw httpError(404, `Role ${normalized} not found`);

      await tx.userRole.deleteMany({ where: { userId } });
      await tx.userRole.create({
        data: {
          id: generateUserId(),
          userId,
          roleId: role.id,
          createdAt: new Date(),
        },
      });
    });

    const updatedUser = await userRepository.findById(userId);
    return { updatedUser: updatedUser!, roleName: normalized };
  },

  /** Crea los roles base si no existen (auth-service hace lo mismo al arrancar) */
  async seedRoles() {
    for (const name of ALLOWED_ROLES) {
      const exists = await prisma.role.findUnique({ where: { name } });
      if (exists) continue;
      try {
        await prisma.role.create({
          data: { id: generateUserId(), name, createdAt: new Date() },
        });
      } catch (error) {
        // Otro servicio lo creó al mismo tiempo (índice único en name)
        if ((error as { code?: string }).code !== 'P2002') throw error;
      }
    }
  },
};
