/** Usuario del dominio, independiente de la base de datos */
export interface User {
  id: string;
  name: string;
  surname: string;
  username: string;
  email: string;
  /** Hash Argon2id */
  passwordHash: string;
  /** false hasta verificar el email, o si un administrador lo desactiva */
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
  profile: { phone: string; profilePicture: string } | null;
  emailVerification: { verified: boolean } | null;
  passwordReset: { token: string | null } | null;
  /** Nombres de rol; el primero es el rol efectivo */
  roles: string[];
}

export interface NewUser {
  name: string;
  surname: string;
  username: string;
  email: string;
  passwordHash: string;
  phone: string;
  profilePicture: string;
  roleName: string;
}
