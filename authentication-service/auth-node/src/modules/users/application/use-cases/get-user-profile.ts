import { NotFoundError } from '../../../../shared/domain/errors.ts';
import type { UserRepository } from '../ports.ts';
import type { UserPresenter } from '../user-response.ts';

interface Deps {
  users: UserRepository;
  present: UserPresenter;
}

/** Perfil por id (sesión propia o consulta interna entre servicios) */
export const makeGetUserProfile =
  ({ users, present }: Deps) =>
  async (userId: string) => {
    const user = await users.findById(userId);
    if (!user) throw new NotFoundError('Usuario no encontrado');
    return present(user);
  };

/** Perfil por username o email (consulta interna entre servicios) */
export const makeGetUserProfileByUsername =
  ({ users, present }: Deps) =>
  async (username: string) => {
    const user = await users.findByEmailOrUsername(username.trim());
    if (!user) throw new NotFoundError('Usuario no encontrado');
    return present(user);
  };
