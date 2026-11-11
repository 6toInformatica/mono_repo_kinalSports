import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { loginRequest, logoutRequest } from "@/server/auth-api";
import { isSameOrigin } from "@/server/origin";
import {
  ADMIN_ROLE,
  clearSession,
  COOKIE,
  parseSessionUser,
  writeSession,
} from "@/server/session";

const NOT_ADMIN = "No tienes permisos para acceder como administrador.";

/** Usuario de la sesión actual (o 401 si no hay sesión) */
export async function GET() {
  const store = await cookies();
  const user = parseSessionUser(store.get(COOKIE.user)?.value);
  const hasSession = Boolean(store.get(COOKIE.refresh)?.value);

  if (!user || !hasSession) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user });
}

/**
 * Inicio de sesión. Los tokens se quedan en cookies httpOnly; al navegador solo
 * se devuelve el usuario. Solo pueden entrar administradores.
 */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { message: "Origen no permitido" },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    emailOrUsername?: string;
    password?: string;
  };

  const { response, data } = await loginRequest(
    body.emailOrUsername ?? "",
    body.password ?? "",
  );

  if (!response.ok) {
    return NextResponse.json(
      { message: data.message ?? "Error de autenticación" },
      { status: response.status },
    );
  }

  const accessToken = data.accessToken ?? data.token;
  const user = data.userDetails;
  if (!accessToken || !data.refreshToken || !user) {
    return NextResponse.json(
      { message: "Respuesta de autenticación inválida" },
      { status: 502 },
    );
  }

  if (user.role !== ADMIN_ROLE) {
    // La sesión recién emitida no se va a usar: se revoca
    await logoutRequest(data.refreshToken).catch(() => undefined);
    return NextResponse.json({ message: NOT_ADMIN }, { status: 403 });
  }

  const result = NextResponse.json({ user });
  writeSession(
    result,
    {
      accessToken,
      refreshToken: data.refreshToken,
      expiresIn: data.expiresIn,
    },
    user,
  );
  return result;
}

/** Cierre de sesión: revoca el refresh token y borra las cookies */
export async function DELETE(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { message: "Origen no permitido" },
      { status: 403 },
    );
  }

  const refreshToken = (await cookies()).get(COOKIE.refresh)?.value;
  if (refreshToken) {
    await logoutRequest(refreshToken).catch(() => undefined);
  }

  const result = NextResponse.json({ message: "Sesión cerrada" });
  clearSession(result);
  return result;
}
