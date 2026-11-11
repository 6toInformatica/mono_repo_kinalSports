import "server-only";
import { serverConfig } from "./config";
import type { SessionTokens, SessionUser } from "./session";

interface LoginResponse {
  accessToken?: string;
  token?: string;
  refreshToken?: string;
  expiresIn?: number;
  userDetails?: SessionUser;
  message?: string;
}

/** El backend no respondió: se informa como servicio no disponible (503) */
export const unavailable = () =>
  Response.json(
    { message: "El servicio no está disponible. Intenta de nuevo más tarde." },
    { status: 503 },
  );

const postJson = async (path: string, body: unknown) => {
  const response = await fetch(`${serverConfig.authApiUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  }).catch(() => unavailable());
  const data = (await response.json().catch(() => ({}))) as LoginResponse;
  return { response, data };
};

export const loginRequest = (emailOrUsername: string, password: string) =>
  postJson("/auth/login", { emailOrUsername, password });

export const logoutRequest = (refreshToken: string) =>
  postJson("/auth/logout", { refreshToken });

/**
 * Renovaciones en curso o recién hechas, por refresh token.
 * El refresh token se rota en cada uso y reutilizar uno viejo revoca toda la sesión,
 * así que si varias peticiones lo necesitan a la vez, comparten la misma renovación.
 */
const refreshes = new Map<
  string,
  { promise: Promise<SessionTokens | null>; expiresAt: number }
>();
const SHARED_REFRESH_MS = 30_000;

export const refreshSession = (refreshToken: string) => {
  const now = Date.now();
  for (const [token, entry] of refreshes) {
    if (entry.expiresAt < now) refreshes.delete(token);
  }

  const existing = refreshes.get(refreshToken);
  if (existing) return existing.promise;

  const promise = postJson("/auth/refresh", { refreshToken }).then(
    ({ response, data }) => {
      const accessToken = data.accessToken ?? data.token;
      if (!response.ok || !accessToken || !data.refreshToken) return null;
      return {
        accessToken,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn,
      };
    },
    () => null,
  );
  refreshes.set(refreshToken, { promise, expiresAt: now + SHARED_REFRESH_MS });
  return promise;
};
