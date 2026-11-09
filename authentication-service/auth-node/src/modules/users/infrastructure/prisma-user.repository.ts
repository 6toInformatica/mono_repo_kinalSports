import type {
  Prisma,
  PrismaClient,
} from '../../../infrastructure/database/prisma.ts';
import { generateId } from '../../../shared/domain/ids.ts';
import type { UserRepository } from '../application/ports.ts';
import type { NewUser, User } from '../domain/user.ts';

/** Relaciones que forman un usuario completo del dominio */
const userWithRelations = {
  userProfile: true,
  userEmail: true,
  userPasswordReset: true,
  userRoles: { include: { role: true } },
} satisfies Prisma.UserInclude;

type UserRecord = Prisma.UserGetPayload<{
  include: typeof userWithRelations;
}>;

/** Fila de Prisma → entidad de dominio */
export const toDomainUser = (record: UserRecord): User => ({
  id: record.id,
  name: record.name,
  surname: record.surname,
  username: record.username,
  email: record.email,
  passwordHash: record.password,
  status: record.status,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
  profile: record.userProfile && {
    phone: record.userProfile.phone,
    profilePicture: record.userProfile.profilePicture,
  },
  emailVerification: record.userEmail && {
    verified: record.userEmail.emailVerified,
  },
  passwordReset: record.userPasswordReset && {
    token: record.userPasswordReset.passwordResetToken,
  },
  roles: record.userRoles.map((userRole) => userRole.role.name),
});

const SEARCH_ERROR = 'Error al buscar usuario';

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

export class PrismaUserRepository implements UserRepository {
  readonly #db: PrismaClient;

  constructor(db: PrismaClient) {
    this.#db = db;
  }

  findById(id: string) {
    return guard(SEARCH_ERROR, () => this.#findOne({ id }));
  }

  async findByEmailOrUsername(emailOrUsername: string) {
    const id = await guard(SEARCH_ERROR, () =>
      this.#findIdByEmailOrUsername(emailOrUsername, emailOrUsername)
    );
    return id ? this.findById(id) : null;
  }

  findByEmail(email: string) {
    return guard(SEARCH_ERROR, () =>
      this.#findOne({ email: email.toLowerCase() })
    );
  }

  async existsByEmailOrUsername(email: string, username: string) {
    const id = await guard('Error al verificar usuario', () =>
      this.#findIdByEmailOrUsername(email, username)
    );
    return id !== null;
  }

  findByEmailVerificationToken(token: string) {
    return guard(SEARCH_ERROR, () =>
      this.#findFirst({
        userEmail: {
          emailVerificationToken: token,
          emailVerificationTokenExpiry: { gt: new Date() },
        },
      })
    );
  }

  findByPasswordResetToken(token: string) {
    return guard(SEARCH_ERROR, () =>
      this.#findFirst({
        userPasswordReset: {
          passwordResetToken: token,
          passwordResetTokenExpiry: { gt: new Date() },
        },
      })
    );
  }

  async create(user: NewUser) {
    const now = new Date();
    const userId = generateId();

    await guard('Error al crear usuario', () =>
      this.#db.$transaction(async (tx) => {
        await tx.user.create({
          data: {
            id: userId,
            name: user.name,
            surname: user.surname,
            username: user.username.toLowerCase(),
            email: user.email.toLowerCase(),
            password: user.passwordHash,
            // Desactivado hasta que verifique su email
            status: false,
            createdAt: now,
            userProfile: {
              create: {
                id: generateId(),
                phone: user.phone,
                profilePicture: user.profilePicture,
              },
            },
            userEmail: { create: { id: generateId(), emailVerified: false } },
            userPasswordReset: { create: { id: generateId() } },
          },
        });

        const role = await tx.role.findUnique({
          where: { name: user.roleName },
        });
        if (role) {
          await tx.userRole.create({
            data: { id: generateId(), userId, roleId: role.id, createdAt: now },
          });
        } else {
          console.warn(
            `${user.roleName} not found in database during user creation for user ${userId}`
          );
        }
      })
    );

    return this.findById(userId);
  }

  async setEmailVerificationToken(userId: string, token: string, expiry: Date) {
    await guard('Error al actualizar token de verificación', () =>
      this.#db.userEmail.updateMany({
        where: { userId },
        data: {
          emailVerificationToken: token,
          emailVerificationTokenExpiry: expiry,
        },
      })
    );
  }

  async markEmailAsVerified(userId: string) {
    await guard('Error al verificar email', () =>
      this.#db.$transaction([
        this.#db.userEmail.updateMany({
          where: { userId },
          data: {
            emailVerified: true,
            emailVerificationToken: null,
            emailVerificationTokenExpiry: null,
          },
        }),
        this.#db.user.updateMany({
          where: { id: userId },
          data: { status: true },
        }),
      ])
    );
  }

  async setPasswordResetToken(userId: string, token: string, expiry: Date) {
    await guard('Error al actualizar token de reset', async () => {
      const { count } = await this.#db.userPasswordReset.updateMany({
        where: { userId },
        data: { passwordResetToken: token, passwordResetTokenExpiry: expiry },
      });

      // Usuarios creados fuera de este servicio pueden no tener la fila
      if (count === 0) {
        await this.#db.userPasswordReset.create({
          data: {
            id: generateId(),
            userId,
            passwordResetToken: token,
            passwordResetTokenExpiry: expiry,
          },
        });
      }
    });
  }

  async updatePassword(userId: string, passwordHash: string) {
    await guard('Error al actualizar contraseña', () =>
      this.#db.$transaction([
        this.#db.user.updateMany({
          where: { id: userId },
          data: { password: passwordHash },
        }),
        // Cierra las sesiones abiertas con la contraseña anterior
        this.#db.refreshToken.updateMany({
          where: { userId, revokedAt: null },
          data: { revokedAt: new Date() },
        }),
        this.#db.userPasswordReset.updateMany({
          where: { userId },
          data: { passwordResetToken: null, passwordResetTokenExpiry: null },
        }),
      ])
    );
  }

  async updateProfilePicture(userId: string, profilePicture: string) {
    await guard('Error al actualizar foto de perfil', () =>
      this.#db.userProfile.updateMany({
        where: { userId },
        data: { profilePicture },
      })
    );
  }

  async #findOne(where: Prisma.UserWhereUniqueInput) {
    const record = await this.#db.user.findUnique({
      where,
      include: userWithRelations,
    });
    return record && toDomainUser(record);
  }

  async #findFirst(where: Prisma.UserWhereInput) {
    const record = await this.#db.user.findFirst({
      where,
      include: userWithRelations,
    });
    return record && toDomainUser(record);
  }

  /**
   * Email exacto (se guarda en minúsculas) o lower(username) = lower(valor):
   * auth-service guarda el username tal como se escribió. SQL parametrizado y sin
   * ILIKE, para que `_` y `%` no actúen como comodines.
   */
  async #findIdByEmailOrUsername(email: string, username: string) {
    const rows = await this.#db.$queryRaw<{ id: string }[]>`
      SELECT id FROM users
      WHERE email = ${email.toLowerCase()}
         OR lower(username) = ${username.toLowerCase()}
      LIMIT 1`;
    return rows[0]?.id ?? null;
  }
}
