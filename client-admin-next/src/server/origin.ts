import "server-only";
import type { NextRequest } from "next/server";

/**
 * Protección CSRF de las rutas que cambian datos: si el navegador envía Origin, debe
 * ser el mismo sitio. Junto con las cookies SameSite=Lax, otra página no puede usar la
 * sesión del administrador. Sin Origin (curl, pruebas) se acepta: no hay cookies ajenas.
 */
export const isSameOrigin = (request: NextRequest) => {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
};
