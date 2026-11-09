import type { AppConfig } from './config/env.ts';
import { prisma } from './infrastructure/database/prisma.ts';
import { createSmtpEmailSender } from './infrastructure/email/smtp-email.sender.ts';
import { argon2PasswordHasher } from './infrastructure/security/argon2-password.hasher.ts';
import { createJwtTokenService } from './infrastructure/security/jwt-token.service.ts';
import { createCloudinaryImageStorage } from './infrastructure/storage/cloudinary-image.storage.ts';
import type { AuthDeps } from './modules/auth/application/deps.ts';
import { makeForgotPassword } from './modules/auth/application/use-cases/forgot-password.ts';
import { makeLoginUser } from './modules/auth/application/use-cases/login-user.ts';
import {
  makeLogout,
  makeRefreshSession,
} from './modules/auth/application/use-cases/refresh-session.ts';
import { makeRegisterUser } from './modules/auth/application/use-cases/register-user.ts';
import { makeResendVerification } from './modules/auth/application/use-cases/resend-verification.ts';
import { makeResetPassword } from './modules/auth/application/use-cases/reset-password.ts';
import { makeVerifyEmail } from './modules/auth/application/use-cases/verify-email.ts';
import { PrismaRefreshTokenRepository } from './modules/auth/infrastructure/prisma-refresh-token.repository.ts';
import { makeChangeUserRole } from './modules/roles/application/use-cases/change-user-role.ts';
import {
  makeGetUserRoles,
  makeListUsersByRole,
} from './modules/roles/application/use-cases/list-users-by-role.ts';
import { ALLOWED_ROLES } from './modules/roles/domain/roles.ts';
import { PrismaRoleRepository } from './modules/roles/infrastructure/prisma-role.repository.ts';
import {
  makeGetUserProfile,
  makeGetUserProfileByUsername,
} from './modules/users/application/use-cases/get-user-profile.ts';
import { makeUpdateProfilePicture } from './modules/users/application/use-cases/update-profile-picture.ts';
import { createUserPresenter } from './modules/users/application/user-response.ts';
import { PrismaUserRepository } from './modules/users/infrastructure/prisma-user.repository.ts';

/**
 * Raíz de composición: el único lugar que conoce las implementaciones concretas
 * (Prisma, Argon2, JWT, SMTP, Cloudinary). Los casos de uso solo ven los puertos.
 */
export const createContainer = (config: AppConfig) => {
  const users = new PrismaUserRepository(prisma);
  const roles = new PrismaRoleRepository(prisma);
  const refreshTokens = new PrismaRefreshTokenRepository(prisma);
  const tokens = createJwtTokenService(config.jwt);
  const images = createCloudinaryImageStorage(config.cloudinary);
  const present = createUserPresenter(images);

  const deps: AuthDeps = {
    users,
    roles,
    refreshTokens,
    tokens,
    passwords: argon2PasswordHasher,
    emails: createSmtpEmailSender(config.smtp, config.frontendUrl),
    images,
    present,
    uploadPath: config.upload.path,
    cloudinary: {
      baseUrl: config.cloudinary.baseUrl,
      folder: config.cloudinary.folder,
    },
  };

  return {
    auth: {
      register: makeRegisterUser(deps),
      login: makeLoginUser(deps),
      verifyEmail: makeVerifyEmail(deps),
      resendVerification: makeResendVerification(deps),
      forgotPassword: makeForgotPassword(deps),
      resetPassword: makeResetPassword(deps),
      refreshSession: makeRefreshSession(deps),
      logout: makeLogout(deps),
    },
    users: {
      getProfile: makeGetUserProfile(deps),
      getProfileByUsername: makeGetUserProfileByUsername(deps),
      updateProfilePicture: makeUpdateProfilePicture(deps),
    },
    roles: {
      changeUserRole: makeChangeUserRole(deps),
      getUserRoles: makeGetUserRoles(deps),
      listUsersByRole: makeListUsersByRole(deps),
      /** Roles base (auth-service hace lo mismo al arrancar) */
      seed: () => roles.ensureRoles(ALLOWED_ROLES),
    },
    /** Para el hook de autenticación */
    session: { tokens, users },
  };
};

export type Container = ReturnType<typeof createContainer>;
