import { NextResponse, type NextRequest } from "next/server";
import { refreshSession } from "@/server/auth-api";
import {
  ADMIN_ROLE,
  clearSession,
  COOKIE,
  parseSessionUser,
  writeSession,
} from "@/server/session";

/**
 * Protección de páginas en el servidor, antes de renderizar:
 * - /dashboard exige sesión de administrador; si el access token venció se renueva aquí.
 * - / (login) con una sesión activa lleva directo al panel.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const refreshToken = request.cookies.get(COOKIE.refresh)?.value;
  const user = parseSessionUser(request.cookies.get(COOKIE.user)?.value);
  const hasSession = Boolean(refreshToken && user);

  if (pathname === "/") {
    return hasSession && user?.role === ADMIN_ROLE
      ? NextResponse.redirect(new URL("/dashboard", request.url))
      : NextResponse.next();
  }

  // /dashboard/...
  if (!hasSession) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (user?.role !== ADMIN_ROLE) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  if (request.cookies.get(COOKIE.access)?.value) return NextResponse.next();

  // Venció el access token: se renueva antes de mostrar la página
  const renewed = await refreshSession(refreshToken!);
  if (!renewed) {
    const response = NextResponse.redirect(new URL("/", request.url));
    clearSession(response);
    return response;
  }

  // Las páginas de esta misma petición ya ven el token nuevo
  request.cookies.set(COOKIE.access, renewed.accessToken);
  request.cookies.set(COOKIE.refresh, renewed.refreshToken);
  const response = NextResponse.next({ request: { headers: request.headers } });
  writeSession(response, renewed);
  return response;
}

export const config = {
  matcher: ["/", "/dashboard/:path*"],
};
