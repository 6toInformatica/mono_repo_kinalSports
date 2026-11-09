import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { ConflictError } from '../../../../shared/domain/errors.ts';
import { generateSecureToken } from '../../../../shared/domain/secure-token.ts';
import { USER_ROLE } from '../../../roles/domain/roles.ts';
import {
  EMAIL_VERIFICATION_TTL_MS,
  inBackground,
  type AuthDeps,
} from '../deps.ts';

export interface RegisterInput {
  name: string;
  surname: string;
  username: string;
  email: string;
  password: string;
  phone: string;
  /** Ruta del archivo subido o URL/ruta de Cloudinary */
  profilePicture: string | null;
}

type Deps = Pick<
  AuthDeps,
  | 'users'
  | 'passwords'
  | 'emails'
  | 'images'
  | 'present'
  | 'uploadPath'
  | 'cloudinary'
>;

export const makeRegisterUser = (deps: Deps) => {
  const { users, passwords, emails, images, present } = deps;

  /**
   * Foto a guardar: un archivo local se sube a Cloudinary (si falla, se usa el avatar
   * por defecto); una URL o ruta de Cloudinary se reduce al nombre del archivo.
   */
  const resolveProfilePicture = async (picture: string | null) => {
    if (!picture) return null;

    const isLocalFile =
      picture.includes('uploads/') ||
      picture.includes(deps.uploadPath) ||
      picture.startsWith('./');

    if (isLocalFile) {
      try {
        const suffix = randomBytes(6).toString('hex');
        const fileName = `profile-${suffix}${path.extname(picture)}`;
        return await images.upload(picture, fileName);
      } catch (error) {
        console.error(
          'Error uploading profile picture to Cloudinary during registration:',
          error
        );
        return null;
      }
    }

    const { baseUrl, folder } = deps.cloudinary;
    let normalized = picture;
    if (normalized.startsWith(baseUrl)) {
      normalized = normalized.slice(baseUrl.length);
    }
    if (folder && normalized.startsWith(`${folder}/`)) {
      normalized = normalized.slice(folder.length + 1);
    }
    return normalized.split('/').pop() ?? null;
  };

  return async (input: RegisterInput) => {
    if (await users.existsByEmailOrUsername(input.email, input.username)) {
      throw new ConflictError(
        'Ya existe un usuario con este email o nombre de usuario'
      );
    }

    const profilePicture = await resolveProfilePicture(input.profilePicture);

    // Argon2id (~100 MB) se calcula antes de abrir la transacción
    let passwordHash: string;
    try {
      passwordHash = await passwords.hash(input.password);
    } catch (error) {
      console.error('Error creando usuario:', error);
      throw new Error('Error al crear usuario');
    }

    const user = await users.create({
      name: input.name,
      surname: input.surname,
      username: input.username,
      email: input.email,
      passwordHash,
      phone: input.phone,
      profilePicture: profilePicture || images.defaultAvatarPath(),
      roleName: USER_ROLE,
    });
    if (!user) throw new Error('Error al crear usuario');

    const verificationToken = generateSecureToken();
    await users.setEmailVerificationToken(
      user.id,
      verificationToken,
      new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS)
    );
    inBackground('verification', () =>
      emails.sendVerification(input.email, input.name, verificationToken)
    );

    // Sin JWT: la sesión empieza en el login (igual que RegisterResponseDto de .NET)
    return {
      success: true,
      user: present(user),
      message:
        'Usuario registrado exitosamente. Por favor, verifica tu email para activar la cuenta.',
      emailVerificationRequired: true,
    };
  };
};
