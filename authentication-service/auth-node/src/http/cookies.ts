import type { FastifyReply, FastifyRequest } from 'fastify';

export const AUTH_COOKIE = {
  access: 'kinal_access',
  refresh: 'kinal_refresh',
} as const;

const ACCESS_MAX_AGE = 15 * 60; // 15 minutos
const REFRESH_MAX_AGE = 30 * 24 * 60 * 60; // 30 días

/**
 * Secure cookies: obligatorio en HTTPS real.
 * SECURE_COOKIES=true|false sobrescribe el default (NODE_ENV === 'production')
 * para poder probar docker-compose.prod.yml en http://localhost.
 */
export const cookiesAreSecure = () => {
  if (process.env.SECURE_COOKIES === 'true') return true;
  if (process.env.SECURE_COOKIES === 'false') return false;
  return process.env.NODE_ENV === 'production';
};

const serializeCookie = (
  name: string,
  value: string,
  maxAge: number,
  secure: boolean
) => {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ];
  if (secure) parts.push('Secure');
  return parts.join('; ');
};

/** Lee una cookie por nombre desde la cabecera Cookie */
export const readCookie = (
  request: FastifyRequest,
  name: string
): string | undefined => {
  const header = request.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [rawKey, ...rest] = part.trim().split('=');
    if (rawKey === name) {
      const value = rest.join('=');
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    }
  }
  return undefined;
};

/** Adjunta los tokens de sesión en cookies httpOnly para clientes web (SPA) */
export const setAuthCookies = (
  reply: FastifyReply,
  tokens: { accessToken: string; refreshToken: string; expiresIn?: number },
  secure = cookiesAreSecure()
) => {
  const accessMaxAge = tokens.expiresIn ?? ACCESS_MAX_AGE;
  reply.header('set-cookie', [
    serializeCookie(
      AUTH_COOKIE.access,
      tokens.accessToken,
      accessMaxAge,
      secure
    ),
    serializeCookie(
      AUTH_COOKIE.refresh,
      tokens.refreshToken,
      REFRESH_MAX_AGE,
      secure
    ),
  ]);
};

/** Limpia las cookies httpOnly de sesión al cerrar sesión */
export const clearAuthCookies = (
  reply: FastifyReply,
  secure = cookiesAreSecure()
) => {
  reply.header('set-cookie', [
    serializeCookie(AUTH_COOKIE.access, '', 0, secure),
    serializeCookie(AUTH_COOKIE.refresh, '', 0, secure),
  ]);
};
