import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { refreshSession } from "@/server/auth-api";
import { DELETE, GET, POST } from "./route";

// Cookies de la petición actual (next/headers)
let jar: Record<string, string> = {};
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (jar[name] ? { value: jar[name] } : undefined),
  }),
}));
vi.mock("@/server/auth-api", () => ({
  refreshSession: vi.fn(),
  unavailable: () =>
    Response.json({ message: "no disponible" }, { status: 503 }),
}));

const fetchMock = vi.fn();
const reply = (status: number, body: unknown = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const call = (
  handler: typeof GET,
  path: string,
  init: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  } = {},
) => {
  // Los segmentos de la ruta no incluyen la query (?page=2)
  const [service, ...rest] = path.split("?")[0]!.split("/");
  const request = new NextRequest(`http://localhost:3000/api/backend/${path}`, {
    method: init.method ?? "GET",
    headers: { host: "localhost:3000", ...init.headers },
    body: init.body,
  });
  return handler(request, {
    params: Promise.resolve({ service: service!, path: rest }),
  });
};

const sentAuthorization = (index = 0) =>
  (fetchMock.mock.calls[index]![1].headers as Headers).get("authorization");

beforeEach(() => {
  vi.stubEnv("AUTH_API_URL", "http://auth:5156/api/v1");
  vi.stubEnv("ADMIN_API_URL", "http://admin:3009/kinalSportsAdmin/v1");
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  vi.mocked(refreshSession).mockReset();
  jar = { kinal_access: "access-1", kinal_refresh: "refresh-1" };
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("proxy /api/backend", () => {
  it("reenvía al backend con el access token de la cookie", async () => {
    fetchMock.mockResolvedValue(reply(200, { data: [] }));

    const response = await call(GET, "admin/fields?page=2");

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]![0]).toBe(
      "http://admin:3009/kinalSportsAdmin/v1/fields?page=2",
    );
    expect(sentAuthorization()).toBe("Bearer access-1");
  });

  it("si el token venció, lo renueva una vez, repite la petición y guarda las cookies nuevas", async () => {
    fetchMock
      .mockResolvedValueOnce(reply(401, { error: "TOKEN_EXPIRED" }))
      .mockResolvedValueOnce(reply(200, { ok: true }));
    vi.mocked(refreshSession).mockResolvedValue({
      accessToken: "access-2",
      refreshToken: "refresh-2",
      expiresIn: 900,
    });

    const response = await call(GET, "admin/teams");

    expect(refreshSession).toHaveBeenCalledWith("refresh-1");
    expect(sentAuthorization(1)).toBe("Bearer access-2");
    expect(response.status).toBe(200);
    expect(response.cookies.get("kinal_access")?.value).toBe("access-2");
    expect(response.cookies.get("kinal_refresh")?.value).toBe("refresh-2");
  });

  it("si no se puede renovar, borra la sesión y avisa con x-session-expired", async () => {
    fetchMock.mockResolvedValue(reply(401));
    vi.mocked(refreshSession).mockResolvedValue(null);

    const response = await call(GET, "admin/teams");

    expect(response.status).toBe(401);
    expect(response.headers.get("x-session-expired")).toBe("1");
    expect(response.cookies.get("kinal_refresh")?.value).toBe("");
  });

  it("sin access token pero con sesión, renueva antes de llamar", async () => {
    jar = { kinal_refresh: "refresh-1" };
    vi.mocked(refreshSession).mockResolvedValue({
      accessToken: "access-2",
      refreshToken: "refresh-2",
    });
    fetchMock.mockResolvedValue(reply(200));

    await call(GET, "admin/teams");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(sentAuthorization()).toBe("Bearer access-2");
  });

  it("las rutas públicas no envían token ni intentan renovar", async () => {
    fetchMock.mockResolvedValue(reply(401, { message: "Token inválido" }));

    const response = await call(POST, "auth/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token: "x" }),
    });

    expect(sentAuthorization()).toBeNull();
    expect(refreshSession).not.toHaveBeenCalled();
    expect(response.headers.get("x-session-expired")).toBeNull();
  });

  it.each(["auth/auth/login", "auth/auth/refresh", "auth/auth/logout"])(
    "bloquea %s: la sesión solo se maneja con /api/session",
    async (path) => {
      const response = await call(POST, path, { method: "POST" });

      expect(response.status).toBe(404);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("responde 404 a un servicio desconocido", async () => {
    expect((await call(GET, "otro/x")).status).toBe(404);
  });

  it("rechaza cambios desde otro origen (CSRF)", async () => {
    const response = await call(DELETE, "admin/fields/1", {
      method: "DELETE",
      headers: { origin: "https://sitio-malicioso.test" },
    });

    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("responde 503 si el backend no responde", async () => {
    fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));

    expect((await call(GET, "admin/fields")).status).toBe(503);
  });
});
