import {
  LockedError,
  UnauthorizedError,
} from '../../../../shared/domain/errors.ts';
import { USER_ROLE } from '../../../roles/domain/roles.ts';
import { ACCESS_TOKEN_TTL_SECONDS } from '../../domain/refresh-token.ts';
import type { AuthDeps } from '../deps.ts';

type Deps = Pick<
  AuthDeps,
  'users' | 'passwords' | 'tokens' | 'refreshTokens' | 'present'
>;

/** Inicia sesión con email o username: access token (15 min) + refresh token (30 días) */
export const makeLoginUser =
  ({ users, passwords, tokens, refreshTokens, present }: Deps) =>
  async (emailOrUsername: string, password: string) => {
    const user = await users.findByEmailOrUsername(emailOrUsername);
    if (!user || !(await passwords.verify(user.passwordHash, password))) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    if (!user.emailVerification?.verified) {
      throw new UnauthorizedError(
        'Debes verificar tu email antes de iniciar sesión. Revisa tu bandeja de entrada o reenvía el email de verificación.'
      );
    }

    if (!user.status) {
      throw new LockedError(
        'Tu cuenta está desactivada. Contacta al administrador.'
      );
    }

    const accessToken = await tokens.createAccessToken(
      user.id,
      user.roles[0] || USER_ROLE
    );
    const { raw: refreshToken } = await refreshTokens.issue(user.id);

    const details = present(user);
    return {
      success: true,
      message: 'Login exitoso',
      accessToken,
      refreshToken,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      userDetails: {
        id: details.id,
        username: details.username,
        email: details.email,
        name: details.name,
        surname: details.surname,
        profilePicture: details.profilePicture,
        role: details.role,
      },
    };
  };
