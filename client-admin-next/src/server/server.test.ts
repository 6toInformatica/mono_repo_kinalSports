import { NextRequest, NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { refreshSession } from "./auth-api";
import { isSameOrigin } from "./origin";
import { parseSessionUser, readAccessTokenRole, writeSession } from "./session";

describe("isSameOrigin", () => {
  const request = (headers: Record<string, string>) =>
    new NextRequest("http://localhost:3000/api/x", {
      headers: { host: "localhost:3000", ...headers },
    });

  it("acepta el mismo sitio y las peticiones sin Origin", () => {
    expect(isSameOrigin(request({ origin: "http://localhost:3000" }))).toBe(
      true,
    );
    expect(isSameOrigin(request({}))).toBe(true);
  });

  it("rechaza otro sitio o un Origin inválido", () => {
    expect(isSameOrigin(request({ origin: "https://otro.test" }))).toBe(false);
    expect(isSameOrigin(request({ origin: "no es una url" }))).toBe(false);
  });

  it("usa x-forwarded-host detrás de un proxy", () => {
    expect(
      isSameOrigin(
        request({
          origin: "https://admin.kinal.test",
          "x-forwarded-host": "admin.kinal.test",
        }),
      ),
    ).toBe(true);
  });
});

describe("session cookies", () => {
  it("guarda los tokens en cookies httpOnly; el access vence 30 s antes", () => {
    const response = NextResponse.json({});
    writeSession(response, {
      accessToken: "a",
      refreshToken: "r",
      expiresIn: 900,
    });

    const access = response.cookies.get("kinal_access")!;
    expect(access).toMatchObject({
      value: "a",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 870,
    });
    expect(response.cookies.get("kinal_refresh")?.maxAge).toBe(
      30 * 24 * 60 * 60,
    );
  });

  it("parseSessionUser ignora cookies vacías, corruptas o sin rol", () => {
    expect(parseSessionUser('{"id":"1","role":"ADMIN_ROLE"}')?.role).toBe(
      "ADMIN_ROLE",
    );
    expect(parseSessionUser(undefined)).toBeNull();
    expect(parseSessionUser("{roto")).toBeNull();
    expect(parseSessionUser('{"id":"1"}')).toBeNull();
  });

  it("readAccessTokenRole lee el rol del payload JWT e ignora tokens no JWT", () => {
    const payload = Buffer.from(
      JSON.stringify({ sub: "usr_1", role: "ADMIN_ROLE" }),
    ).toString("base64url");
    expect(readAccessTokenRole(`hdr.${payload}.sig`)).toBe("ADMIN_ROLE");
    expect(readAccessTokenRole("opaque-token")).toBeNull();
    expect(readAccessTokenRole(undefined)).toBeNull();
  });
});

describe("refreshSession", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    vi.stubEnv("AUTH_API_URL", "http://auth:5156/api/v1");
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("comparte una sola renovación entre peticiones simultáneas", async () => {
    // Reusar un refresh token revoca la sesión: solo debe enviarse una vez
    fetchMock.mockResolvedValue(
      Response.json({ accessToken: "a2", refreshToken: "r2", expiresIn: 900 }),
    );

    const [first, second] = await Promise.all([
      refreshSession("r-compartido"),
      refreshSession("r-compartido"),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(first).toEqual({
      accessToken: "a2",
      refreshToken: "r2",
      expiresIn: 900,
    });
    expect(second).toBe(first);
  });

  it("devuelve null si auth rechaza el refresh token", async () => {
    fetchMock.mockResolvedValue(Response.json({}, { status: 401 }));

    expect(await refreshSession("r-invalido")).toBeNull();
  });
});
