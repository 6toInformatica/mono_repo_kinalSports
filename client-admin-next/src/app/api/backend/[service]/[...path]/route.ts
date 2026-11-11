import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { refreshSession, unavailable } from "@/server/auth-api";
import { backendBaseUrl, type BackendService } from "@/server/config";
import { isSameOrigin } from "@/server/origin";
import {
  clearSession,
  COOKIE,
  writeSession,
  type SessionTokens,
} from "@/server/session";

/**
 * Proxy hacia los backends: /api/backend/auth/... → auth-service,
 * /api/backend/admin/... → server-admin.
 * Agrega el access token desde la cookie httpOnly y, si venció, lo renueva una vez
 * con el refresh token y repite la petición. El navegador nunca ve los tokens.
 */
type Context = { params: Promise<{ service: string; path: string[] }> };

const SERVICES: readonly BackendService[] = ["auth", "admin"];

// La sesión se maneja solo con /api/session: por aquí no se emiten ni rotan tokens
const BLOCKED_PATHS = ["auth/login", "auth/refresh", "auth/logout"];

// Públicos: un 401 aquí es un error de negocio (token de correo inválido, etc.), no una
// sesión vencida, así que no se envía el token ni se intenta renovar
const PUBLIC_PATHS = [
  "auth/register",
  "auth/forgot-password",
  "auth/reset-password",
  "auth/verify-email",
  "auth/resend-verification",
];

const FORWARDED_REQUEST_HEADERS = ["content-type", "accept"];
const FORWARDED_RESPONSE_HEADERS = ["content-type", "content-disposition"];

const isExpiredSession = (status: number, body: string) => {
  if (status === 401) return true;
  if (status !== 403) return false;
  try {
    return (JSON.parse(body) as { error?: string }).error === "TOKEN_EXPIRED";
  } catch {
    return false;
  }
};

async function handle(request: NextRequest, context: Context) {
  const { service, path } = await context.params;
  const joinedPath = path.join("/");

  if (!SERVICES.includes(service as BackendService)) {
    return NextResponse.json(
      { message: "Servicio no encontrado" },
      { status: 404 },
    );
  }
  if (BLOCKED_PATHS.includes(joinedPath)) {
    return NextResponse.json(
      { message: "Ruta no disponible" },
      { status: 404 },
    );
  }
  if (request.method !== "GET" && !isSameOrigin(request)) {
    return NextResponse.json(
      { message: "Origen no permitido" },
      { status: 403 },
    );
  }

  const target = `${backendBaseUrl(service as BackendService)}/${joinedPath}${request.nextUrl.search}`;
  // El cuerpo se lee una vez para poder repetir la petición tras renovar el token
  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.arrayBuffer();

  const headers = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const isPublic = service === "auth" && PUBLIC_PATHS.includes(joinedPath);
  const store = await cookies();
  const refreshToken = isPublic ? undefined : store.get(COOKIE.refresh)?.value;

  const send = (accessToken: string | undefined) => {
    const withAuth = new Headers(headers);
    if (accessToken) withAuth.set("authorization", `Bearer ${accessToken}`);
    return fetch(target, {
      method: request.method,
      headers: withAuth,
      body,
      cache: "no-store",
    }).catch(() => unavailable());
  };

  let renewed: SessionTokens | null = null;
  let accessToken = isPublic ? undefined : store.get(COOKIE.access)?.value;

  // Sin access token (venció la cookie) pero con sesión: se renueva antes de llamar
  if (!accessToken && refreshToken) {
    renewed = await refreshSession(refreshToken);
    accessToken = renewed?.accessToken;
  }

  let upstream = await send(accessToken);
  let text = await upstream.text();

  if (isExpiredSession(upstream.status, text) && refreshToken && !renewed) {
    renewed = await refreshSession(refreshToken);
    if (renewed) {
      upstream = await send(renewed.accessToken);
      text = await upstream.text();
    }
  }

  const response = new NextResponse(text, { status: upstream.status });
  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) response.headers.set(name, value);
  }

  if (renewed) writeSession(response, renewed);
  // La sesión ya no se puede renovar: se borra para que la app vuelva al login
  else if (refreshToken && isExpiredSession(upstream.status, text)) {
    clearSession(response);
    response.headers.set("x-session-expired", "1");
  }
  return response;
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
