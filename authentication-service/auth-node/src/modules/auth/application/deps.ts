import type {
  ImageStorage,
  UserRepository,
} from '../../users/application/ports.ts';
import type { UserPresenter } from '../../users/application/user-response.ts';
import type { RoleRepository } from '../../roles/application/ports.ts';
import type {
  EmailSender,
  PasswordHasher,
  RefreshTokenRepository,
  TokenService,
} from './ports.ts';

/** Dependencias de los casos de uso de autenticación */
export interface AuthDeps {
  users: UserRepository;
  roles: RoleRepository;
  refreshTokens: RefreshTokenRepository;
  passwords: PasswordHasher;
  tokens: TokenService;
  emails: EmailSender;
  images: ImageStorage;
  present: UserPresenter;
  /** Carpeta de subidas temporales (para reconocer archivos locales) */
  uploadPath: string;
  cloudinary: { baseUrl: string; folder: string };
}

export const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
/** Los tokens de email y reset son base64url de 32 bytes (43 caracteres) */
export const MIN_SECURE_TOKEN_LENGTH = 40;

/** Tarea en segundo plano (envío de correos): si falla se registra y no afecta la respuesta */
export const inBackground = (label: string, task: () => Promise<unknown>) => {
  Promise.resolve()
    .then(task)
    .catch((error) =>
      console.error(`Async email send (${label}) failed:`, error)
    );
};
