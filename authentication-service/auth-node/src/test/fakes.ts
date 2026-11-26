import { vi } from 'vitest';
import type { AuthDeps } from '../modules/auth/application/deps.ts';
import type { User } from '../modules/users/domain/user.ts';

/** Usuario de ejemplo verificado y activo; se puede sobrescribir cualquier campo */
export const aUser = (overrides: Partial<User> = {}): User => ({
  id: 'usr_SeedUser0002',
  name: 'Andrea',
  surname: 'Morales',
  username: 'andrea.morales',
  email: 'andrea.morales@kinalsports.gt',
  passwordHash: 'hash',
  status: true,
  deletedAt: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  profile: { phone: '42178935', profilePicture: 'avatar.png' },
  emailVerification: { verified: true },
  passwordReset: { token: null },
  roles: ['USER_ROLE'],
  ...overrides,
});

/** Un token seguro válido (43 caracteres, como los que genera el servicio) */
export const SECURE_TOKEN = 'a'.repeat(43);

/** Todas las dependencias de auth con funciones simuladas (vi.fn) */
export const fakeDeps = () => {
  const deps = {
    users: {
      findAll: vi.fn().mockResolvedValue([]),
      findById: vi.fn(),
      findByEmailOrUsername: vi.fn(),
      findByEmail: vi.fn(),
      existsByEmailOrUsername: vi.fn().mockResolvedValue(false),
      findByEmailVerificationToken: vi.fn(),
      findByPasswordResetToken: vi.fn(),
      create: vi.fn(),
      setEmailVerificationToken: vi.fn(),
      markEmailAsVerified: vi.fn(),
      setPasswordResetToken: vi.fn(),
      updatePassword: vi.fn(),
      updateProfilePicture: vi.fn(),
      updateDetails: vi.fn(),
      softDelete: vi.fn(),
    },
    roles: {
      getUserRoleNames: vi.fn().mockResolvedValue(['USER_ROLE']),
      setUserSingleRole: vi.fn(),
      findUsersByRole: vi.fn(),
      ensureRoles: vi.fn(),
    },
    refreshTokens: {
      issue: vi
        .fn()
        .mockResolvedValue({ raw: 'refresh-nuevo', familyId: 'fam1' }),
      findByRawToken: vi.fn(),
      revoke: vi.fn(),
      revokeFamily: vi.fn(),
    },
    passwords: {
      hash: vi.fn().mockResolvedValue('hash-nuevo'),
      verify: vi.fn().mockResolvedValue(true),
    },
    tokens: {
      createAccessToken: vi.fn().mockResolvedValue('access-token'),
      verifyAccessToken: vi.fn(),
    },
    emails: {
      sendVerification: vi.fn().mockResolvedValue(undefined),
      sendPasswordReset: vi.fn().mockResolvedValue(undefined),
      sendWelcome: vi.fn().mockResolvedValue(undefined),
      sendPasswordChanged: vi.fn().mockResolvedValue(undefined),
    },
    images: {
      upload: vi.fn().mockResolvedValue('v1/profile-abc.png'),
      delete: vi.fn(),
      fullUrl: vi.fn((p: string) => `https://cdn.test/${p}`),
      defaultAvatarPath: vi.fn().mockReturnValue('avatarDefault.png'),
    },
    present: vi.fn((user: User) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      surname: user.surname,
      profilePicture: 'https://cdn.test/avatar.png',
      role: user.roles[0],
    })),
    uploadPath: './uploads',
    cloudinary: {
      baseUrl: 'https://res.cloudinary.com/demo/image/upload/',
      folder: 'auth_service/profiles',
    },
  };
  return deps as typeof deps & AuthDeps;
};

/** Espera a que terminen las tareas en segundo plano (envío de correos) */
export const flushBackground = () => new Promise((r) => setTimeout(r, 0));
