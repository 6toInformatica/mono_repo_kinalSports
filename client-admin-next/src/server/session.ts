import "server-only";
import type { NextResponse } from "next/server";
import { serverConfig } from "./config";

/** Usuario de la sesión (lo que devuelve el login como userDetails) */
export interface SessionUser {
  id: string;
  username: string;
  email: string;
  name: string;
  surname: string;
  profilePicture?: string;
  role: string;
}

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  /** Segundos de vigencia del access token */
  expiresIn?: number;
}

export const COOKIE = {
  access: "kinal_access",
  refresh: "kinal_refresh",
  user: "kinal_user",
} as const;

export const ADMIN_ROLE = "ADMIN_ROLE";

const REFRESH_MAX_AGE = 30 * 24 * 60 * 60; // 30 días, igual que el refresh token
const DEFAULT_ACCESS_MAX_AGE = 15 * 60;

/** Cookies httpOnly: JavaScript del navegador no puede leerlas */
const baseCookie = () => ({
  httpOnly: true,
  secure: serverConfig.secureCookies,
  sameSite: "lax" as const,
  path: "/",
});

/** Guarda los tokens (y el usuario, si viene) en la respuesta */
export const writeSession = (
  response: NextResponse,
  tokens: SessionTokens,
  user?: SessionUser,
) => {
  response.cookies.set(COOKIE.access, tokens.accessToken, {
    ...baseCookie(),
    // Un poco antes de que venza, para renovarlo con margen
    maxAge: Math.max((tokens.expiresIn ?? DEFAULT_ACCESS_MAX_AGE) - 30, 30),
  });
  response.cookies.set(COOKIE.refresh, tokens.refreshToken, {
    ...baseCookie(),
    maxAge: REFRESH_MAX_AGE,
  });
  if (user) {
    response.cookies.set(COOKIE.user, JSON.stringify(user), {
      ...baseCookie(),
      maxAge: REFRESH_MAX_AGE,
    });
  }
};

export const clearSession = (response: NextResponse) => {
  for (const name of Object.values(COOKIE)) {
    response.cookies.set(name, "", { ...baseCookie(), maxAge: 0 });
  }
};

/** Usuario guardado en la cookie, o null si no hay o no es válido */
export const parseSessionUser = (
  raw: string | undefined,
): SessionUser | null => {
  if (!raw) return null;
  try {
    const user = JSON.parse(raw) as SessionUser;
    return user && typeof user.role === "string" ? user : null;
  } catch {
    return null;
  }
};
