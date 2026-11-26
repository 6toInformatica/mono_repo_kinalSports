import {
  userProfileCacheKey,
  type CacheStore,
} from '../../../../infrastructure/cache/redis-cache.ts';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '../../../../shared/domain/errors.ts';
import type { UserRepository } from '../ports.ts';
import type { UserPresenter } from '../user-response.ts';
import { ADMIN_ROLE } from '../../../roles/domain/roles.ts';
import type { RoleRepository } from '../../../roles/application/ports.ts';

const LETTERS_AND_SPACES = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;

export interface UserDetailsInput {
  name?: unknown;
  surname?: unknown;
  username?: unknown;
  email?: unknown;
  phone?: unknown;
}

const text = (value: unknown, label: string, max: number) => {
  const trimmed = (typeof value === 'string' ? value : '').trim();
  if (!trimmed || trimmed.length > max) {
    throw new BadRequestError(
      `${label} es obligatorio y admite hasta ${max} caracteres`
    );
  }
  return trimmed;
};

interface Deps {
  users: UserRepository;
  roles: RoleRepository;
  present: UserPresenter;
  cache?: CacheStore;
}

export const makeUpdateUser =
  ({ users, present, cache }: Omit<Deps, 'roles'>) =>
  async (userId: string, input: UserDetailsInput) => {
    const current = await users.findById(userId);
    if (!current || current.deletedAt)
      throw new NotFoundError('Usuario no encontrado');

    const name = text(input.name, 'El nombre', 25);
    const surname = text(input.surname, 'El apellido', 25);
    if (!LETTERS_AND_SPACES.test(name) || !LETTERS_AND_SPACES.test(surname)) {
      throw new BadRequestError(
        'El nombre y el apellido solo pueden contener letras y espacios'
      );
    }
    const username = text(input.username, 'El nombre de usuario', 50);
    const email = text(input.email, 'El correo', 150).toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      throw new BadRequestError(
        'El correo electrónico no tiene un formato válido'
      );
    }
    const phone = (typeof input.phone === 'string' ? input.phone : '').trim();
    if (!/^\d{8}$/.test(phone)) {
      throw new BadRequestError(
        'El número de teléfono debe tener exactamente 8 dígitos'
      );
    }

    const byEmail = await users.findByEmail(email);
    const byUsername = await users.findByEmailOrUsername(username);
    if (
      (byEmail && byEmail.id !== userId) ||
      (byUsername && byUsername.id !== userId)
    ) {
      throw new ConflictError(
        'Ya existe un usuario con este email o nombre de usuario'
      );
    }

    await users.updateDetails(userId, {
      name,
      surname,
      username,
      email,
      phone,
    });
    await cache?.del(userProfileCacheKey(userId));
    const updated = await users.findById(userId);
    if (!updated) throw new NotFoundError('Usuario no encontrado');
    return present(updated);
  };

export const makeDeactivateUser =
  ({ users, roles, cache }: Deps) =>
  async (actorId: string, userId: string) => {
    if (actorId === userId) {
      throw new ConflictError('No puedes desactivar tu propia cuenta');
    }
    const current = await users.findById(userId);
    if (!current || current.deletedAt)
      throw new NotFoundError('Usuario no encontrado');

    if (current.roles.includes(ADMIN_ROLE)) {
      const admins = (await roles.findUsersByRole(ADMIN_ROLE)).filter(
        (user) => !user.deletedAt
      );
      if (admins.length <= 1) {
        throw new ConflictError(
          'No se puede desactivar al último administrador'
        );
      }
    }

    await users.softDelete(userId);
    await cache?.del(userProfileCacheKey(userId));
  };
