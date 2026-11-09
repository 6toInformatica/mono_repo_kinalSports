import { generateUserId } from '../../../../helpers/uuid-generator.js';
import {
  prisma,
  type DbClient,
  type Prisma,
} from '../../../infrastructure/database/prisma.ts';

/** Usuario con todas sus relaciones (perfil, email, reset de contraseña y roles) */
export const userWithRelations = {
  userProfile: true,
  userEmail: true,
  userPasswordReset: true,
  userRoles: { include: { role: true } },
} satisfies Prisma.UserInclude;

export type UserWithRelations = Prisma.UserGetPayload<{
  include: typeof userWithRelations;
}>;

export interface NewUserData {
  name: string;
  surname: string;
  username: string;
  email: string;
  /** Contraseña ya hasheada (Argon2id): el hash se calcula fuera de la transacción */
  passwordHash: string;
  phone: string;
  profilePicture: string;
  roleName: string;
}

/**
 * Id del usuario cuyo email o username coincide, sin distinguir mayúsculas.
 * auth-service (.NET) guarda el username tal como se escribió, así que la comparación
 * es lower(username) = lower(valor). El email siempre se guarda en minúsculas.
 * SQL parametrizado: sin ILIKE, para que `_` y `%` no actúen como comodines.
 */
const findIdByEmailOrUsername = async (
  email: string,
  username: string,
  db: DbClient = prisma
) => {
  const rows = await db.$queryRaw<{ id: string }[]>`
    SELECT id FROM users
    WHERE email = ${email.toLowerCase()}
       OR lower(username) = ${username.toLowerCase()}
    LIMIT 1`;
  return rows[0]?.id ?? null;
};

/**
 * Los errores de base se registran y se reemplazan por un mensaje genérico:
 * algunos flujos devuelven el mensaje al cliente y no deben exponer detalles internos.
 */
const guard = async <T>(message: string, operation: () => Promise<T>) => {
  try {
    return await operation();
  } catch (error) {
    console.error(`${message}:`, error);
    throw new Error(message);
  }
};

const SEARCH_ERROR = 'Error al buscar usuario';

export const userRepository = {
  findById(id: string, db: DbClient = prisma) {
    return guard(SEARCH_ERROR, () =>
      db.user.findUnique({ where: { id }, include: userWithRelations })
    );
  },

  async findByEmailOrUsername(emailOrUsername: string) {
    const id = await guard(SEARCH_ERROR, () =>
      findIdByEmailOrUsername(emailOrUsername, emailOrUsername)
    );
    return id ? this.findById(id) : null;
  },

  findByEmail(email: string) {
    return guard(SEARCH_ERROR, () =>
      prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: userWithRelations,
      })
    );
  },

  async existsByEmailOrUsername(email: string, username: string) {
    const id = await guard('Error al verificar usuario', () =>
      findIdByEmailOrUsername(email, username)
    );
    return id !== null;
  },

  findStatus(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
  },

  /** Usuario con token de verificación de email vigente */
  findByEmailVerificationToken(token: string) {
    return guard(SEARCH_ERROR, () =>
      prisma.user.findFirst({
        where: {
          userEmail: {
            emailVerificationToken: token,
            emailVerificationTokenExpiry: { gt: new Date() },
          },
        },
        include: userWithRelations,
      })
    );
  },

  /** Usuario con token de reset de contraseña vigente */
  findByPasswordResetToken(token: string) {
    return guard(SEARCH_ERROR, () =>
      prisma.user.findFirst({
        where: {
          userPasswordReset: {
            passwordResetToken: token,
            passwordResetTokenExpiry: { gt: new Date() },
          },
        },
        include: userWithRelations,
      })
    );
  },

  /**
   * Crea el usuario con perfil, email, reset de contraseña y rol en una sola transacción.
   * Empieza desactivado hasta que verifique su email.
   */
  async create(data: NewUserData) {
    const now = new Date();
    const userId = generateUserId();

    await guard('Error al crear usuario', () =>
      prisma.$transaction(async (tx) => {
        await tx.user.create({
          data: {
            id: userId,
            name: data.name,
            surname: data.surname,
            username: data.username.toLowerCase(),
            email: data.email.toLowerCase(),
            password: data.passwordHash,
            status: false,
            createdAt: now,
            userProfile: {
              create: {
                id: generateUserId(),
                phone: data.phone,
                profilePicture: data.profilePicture,
              },
            },
            userEmail: {
              create: { id: generateUserId(), emailVerified: false },
            },
            userPasswordReset: { create: { id: generateUserId() } },
          },
        });

        const role = await tx.role.findUnique({
          where: { name: data.roleName },
        });
        if (role) {
          await tx.userRole.create({
            data: {
              id: generateUserId(),
              userId,
              roleId: role.id,
              createdAt: now,
            },
          });
        } else {
          console.warn(
            `${data.roleName} not found in database during user creation for user ${userId}`
          );
        }
      })
    );

    return this.findById(userId);
  },

  async setEmailVerificationToken(userId: string, token: string, expiry: Date) {
    await guard('Error al actualizar token de verificación', () =>
      prisma.userEmail.updateMany({
        where: { userId },
        data: {
          emailVerificationToken: token,
          emailVerificationTokenExpiry: expiry,
        },
      })
    );
  },

  /** Marca el email como verificado y activa la cuenta */
  async markEmailAsVerified(userId: string) {
    await guard('Error al verificar email', () =>
      prisma.$transaction([
        prisma.userEmail.updateMany({
          where: { userId },
          data: {
            emailVerified: true,
            emailVerificationToken: null,
            emailVerificationTokenExpiry: null,
          },
        }),
        prisma.user.updateMany({
          where: { id: userId },
          data: { status: true },
        }),
      ])
    );
  },

  async setPasswordResetToken(userId: string, token: string, expiry: Date) {
    await guard('Error al actualizar token de reset', async () => {
      const { count } = await prisma.userPasswordReset.updateMany({
        where: { userId },
        data: { passwordResetToken: token, passwordResetTokenExpiry: expiry },
      });

      // Usuarios creados fuera de este servicio pueden no tener la fila
      if (count === 0) {
        await prisma.userPasswordReset.create({
          data: {
            id: generateUserId(),
            userId,
            passwordResetToken: token,
            passwordResetTokenExpiry: expiry,
          },
        });
      }
    });
  },

  /**
   * Cambia la contraseña, cierra las sesiones abiertas con la anterior
   * y consume el token de reset, todo en una transacción.
   */
  async updatePassword(userId: string, passwordHash: string) {
    await guard('Error al actualizar contraseña', () =>
      prisma.$transaction([
        prisma.user.updateMany({
          where: { id: userId },
          data: { password: passwordHash },
        }),
        prisma.refreshToken.updateMany({
          where: { userId, revokedAt: null },
          data: { revokedAt: new Date() },
        }),
        prisma.userPasswordReset.updateMany({
          where: { userId },
          data: { passwordResetToken: null, passwordResetTokenExpiry: null },
        }),
      ])
    );
  },

  async updateProfilePicture(userId: string, profilePicture: string) {
    await guard('Error al actualizar foto de perfil', () =>
      prisma.userProfile.updateMany({
        where: { userId },
        data: { profilePicture },
      })
    );
  },
};

export type UserRepository = typeof userRepository;
