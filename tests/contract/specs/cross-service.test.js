// Contratos entre servicios: redundancia de auth y datos compartidos
import { describe, expect, test } from "vitest";
import { http } from "../lib/http.js";
import { urls, users } from "../lib/config.js";
import { login } from "../lib/session.js";
import { waitForToken } from "../lib/mailpit.js";
import { decodeJwt, newUser } from "../lib/fixtures.js";

const register = async (via, data) => {
  const response = await http.post(`${urls[via]}/auth/register`, {
    form: data,
  });
  expect(response.status).toBe(201);
  const token = await waitForToken(data.email, "verify-email");
  const verified = await http.post(`${urls[via]}/auth/verify-email`, {
    json: { token },
  });
  expect(verified.status).toBe(200);
};

describe("redundancia de autenticación", () => {
  test.each([
    ["auth-node", "authService"],
    ["auth-service", "authNode"],
  ])(
    "un usuario registrado en %s inicia sesión en el otro servicio",
    async (_, otherVia) => {
      const origin = otherVia === "authNode" ? "authService" : "authNode";
      const data = newUser("cx");
      await register(origin, data);
      const session = await login(data.username, {
        via: otherVia,
        password: data.password,
      });
      expect(decodeJwt(session.token).role).toBe("USER_ROLE");
    },
  );

  test("los tokens de ambos servicios llevan los mismos claims", async () => {
    const node = decodeJwt(
      (await login(users.admin, { via: "authNode" })).token,
    );
    const net = decodeJwt(
      (await login(users.admin, { via: "authService" })).token,
    );
    for (const claim of ["sub", "role", "iss", "aud"])
      expect(node[claim]).toEqual(net[claim]);
  });

  test.each([
    ["authNode", "admin"],
    ["authService", "admin"],
    ["authNode", "user"],
    ["authService", "user"],
  ])("un token de %s es aceptado por server-%s", async (via, server) => {
    const session = await login(users.admin, { via });
    const url =
      server === "admin"
        ? `${urls.admin}/reservations?limit=1`
        : `${urls.user}/users/profile`;
    expect((await http.get(url, { token: session.token })).status).toBe(200);
  });
});

describe("datos compartidos", () => {
  test("server-admin enriquece reservas con los datos del usuario", async () => {
    const admin = await login(users.admin);
    const response = await http.get(`${urls.admin}/reservations?limit=50`, {
      token: admin.token,
    });
    const enriched = response.data.data.find((r) => r.user && r.user.username);
    expect(enriched).toBeDefined();
  });

  test("server-user muestra los nombres de los miembros del equipo", async () => {
    const user = await login(users.manager, { via: "authNode" });
    const response = await http.get(`${urls.user}/teams/me/mis-equipos`, {
      token: user.token,
    });
    expect(response.status).toBe(200);
    expect(JSON.stringify(response.data)).not.toContain('"Miembro"');
  });
});
