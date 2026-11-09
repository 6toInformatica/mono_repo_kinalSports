import type { NewUser, User } from '../domain/user.ts';

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  /** Email exacto o username sin distinguir mayúsculas */
  findByEmailOrUsername(emailOrUsername: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  existsByEmailOrUsername(email: string, username: string): Promise<boolean>;
  /** Usuario con token de verificación de email vigente */
  findByEmailVerificationToken(token: string): Promise<User | null>;
  /** Usuario con token de reset de contraseña vigente */
  findByPasswordResetToken(token: string): Promise<User | null>;
  /** Crea usuario, perfil, email, reset y rol en una transacción */
  create(user: NewUser): Promise<User | null>;
  setEmailVerificationToken(
    userId: string,
    token: string,
    expiry: Date
  ): Promise<void>;
  /** Marca el email como verificado y activa la cuenta */
  markEmailAsVerified(userId: string): Promise<void>;
  setPasswordResetToken(
    userId: string,
    token: string,
    expiry: Date
  ): Promise<void>;
  /** Cambia la contraseña, cierra las sesiones y consume el token de reset */
  updatePassword(userId: string, passwordHash: string): Promise<void>;
  updateProfilePicture(userId: string, profilePicture: string): Promise<void>;
}

/** Almacenamiento de imágenes de perfil (Cloudinary) */
export interface ImageStorage {
  /** Sube el archivo local y devuelve la ruta a guardar (v<versión>/<public_id>.<ext>) */
  upload(filePath: string, fileName: string): Promise<string>;
  delete(imagePath: string): Promise<unknown>;
  fullUrl(imagePath: string | null | undefined): string;
  defaultAvatarPath(): string;
}
