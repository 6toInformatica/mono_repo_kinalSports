import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { NotFoundError } from '../../../../shared/domain/errors.ts';
import type { ImageStorage, UserRepository } from '../ports.ts';
import type { UserPresenter } from '../user-response.ts';

interface Deps {
  users: UserRepository;
  images: ImageStorage;
  present: UserPresenter;
}

/** Sube la nueva foto, borra la anterior (salvo el avatar por defecto) y la guarda */
export const makeUpdateProfilePicture =
  ({ users, images, present }: Deps) =>
  async (userId: string, filePath: string) => {
    const user = await users.findById(userId);
    if (!user) throw new NotFoundError('Usuario no encontrado');

    const ext = path.extname(filePath) || '.jpg';
    const fileName = `profile-${randomBytes(6).toString('hex')}${ext}`;
    const profilePicture = await images.upload(filePath, fileName);

    const previous = user.profile?.profilePicture ?? '';
    if (previous && !previous.includes('avatarDefault')) {
      await images.delete(previous);
    }

    await users.updateProfilePicture(userId, profilePicture);

    const updated = await users.findById(userId);
    if (!updated) throw new NotFoundError('Usuario no encontrado');
    return present(updated);
  };
