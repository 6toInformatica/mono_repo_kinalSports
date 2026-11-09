import { UnauthorizedError } from '../../../../shared/domain/errors.ts';
import { USER_ROLE } from '../../../roles/domain/roles.ts';
import { ACCESS_TOKEN_TTL_SECONDS } from '../../domain/refresh-token.ts';
import type { AuthDeps } from '../deps.ts';

type Deps = Pick<AuthDeps, 'users' | 'roles' | 'refreshTokens' | 'tokens'>;

/**
 * Rotación de refresh token con detección de reutilización:
 * cada token sirve una sola vez; si se usa uno ya revocado, se revoca toda su familia.
 */
export const makeRefreshSession =
  ({ users, roles, refreshTokens, tokens }: Deps) =>
  async (rawToken: string) => {
    const stored = await refreshTokens.findByRawToken(rawToken);
    if (!stored) throw new UnauthorizedError('Refresh token inválido');

    if (stored.expiresAt < new Date()) {
      await refreshTokens.revoke(stored.id);
      throw new UnauthorizedError('Refresh token expirado');
    }

    if (stored.revokedAt) {
      await refreshTokens.revokeFamily(stored.familyId);
      throw new UnauthorizedError(
        'Sesión comprometida. Refresh token reutilizado.'
      );
    }

    await refreshTokens.revoke(stored.id);

    // Un usuario desactivado no puede seguir renovando su sesión
    const user = await users.findById(stored.userId);
    if (!user || !user.status) {
      throw new UnauthorizedError('La cuenta está desactivada');
    }

    // El rol se lee de la base para que el token renovado conserve el claim role
    const [role = USER_ROLE] = await roles.getUserRoleNames(stored.userId);
    const accessToken = await tokens.createAccessToken(stored.userId, role);
    const { raw: refreshToken } = await refreshTokens.issue(
      stored.userId,
      stored.familyId
    );

    return { accessToken, refreshToken, expiresIn: ACCESS_TOKEN_TTL_SECONDS };
  };

/** Cierra la sesión revocando el refresh token (si existe y sigue activo) */
export const makeLogout =
  ({ refreshTokens }: Pick<AuthDeps, 'refreshTokens'>) =>
  async (rawToken: string) => {
    const stored = await refreshTokens.findByRawToken(rawToken);
    if (stored && !stored.revokedAt) await refreshTokens.revoke(stored.id);
  };
