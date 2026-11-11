// Contrato de los dos servicios de autenticación (.NET y Node).
// Ambos deben comportarse igual: el mismo guion corre contra cada uno.
import { beforeAll, describe, expect, inject, test } from "vitest";
import { http } from "../lib/http.js";
import { contract } from "../lib/shape.js";
import { urls, users } from "../lib/config.js";
import { login } from "../lib/session.js";
import { messageIds, waitForToken } from "../lib/mailpit.js";
import { decodeJwt, newUser, png, textFile } from "../lib/fixtures.js";

const services = [
  ["auth-node", "authNode"],
  ["auth-service", "authService"],
];

describe.each(services)("%s", (name, via) => {
  const base = urls[via];
  const internalToken = inject("internalToken");
  const fresh = newUser(name === "auth-node" ? "cn" : "cs");
  let admin;
  let session; // sesión del usuario recién registrado
  let freshUserId;

  beforeAll(async () => {
    admin = await login(users.admin, { via });
  });

  test("GET /health", async () => {
    const url =
      name === "auth-node"
        ? `${base}/health`
        : `${urls.authServiceRoot}/health`;
    expect(contract(await http.get(url))).toMatchSnapshot();
  });

  describe("registro y verificación", () => {
    let previousMails = new Set();

    test("POST /auth/register sin datos", async () => {
      expect(
        contract(await http.post(`${base}/auth/register`, { form: {} })),
      ).toMatchSnapshot();
    });

    test("POST /auth/register con archivo que no es imagen", async () => {
      const response = await http.post(`${base}/auth/register`, {
        form: { ...newUser("bad"), profilePicture: textFile() },
      });
      expect(contract(response)).toMatchSnapshot();
    });

    test("POST /auth/register válido", async () => {
      const response = await http.post(`${base}/auth/register`, {
        form: fresh,
      });
      expect(contract(response)).toMatchSnapshot();
    });

    test("POST /auth/register duplicado", async () => {
      const response = await http.post(`${base}/auth/register`, {
        form: fresh,
      });
      expect(contract(response)).toMatchSnapshot();
    });

    test("POST /auth/login sin verificar el correo", async () => {
      const response = await http.post(`${base}/auth/login`, {
        json: { emailOrUsername: fresh.username, password: fresh.password },
      });
      expect(contract(response)).toMatchSnapshot();
    });

    test("POST /auth/resend-verification", async () => {
      // El correo del registro sale en segundo plano y, en frío, puede llegar después del
      // reenvío con un token ya reemplazado: se espera y se descarta antes de reenviar
      await waitForToken(fresh.email, "verify-email");
      previousMails = await messageIds(fresh.email);
      const response = await http.post(`${base}/auth/resend-verification`, {
        json: { email: fresh.email },
      });
      expect(contract(response)).toMatchSnapshot();
    });

    test("POST /auth/resend-verification con correo inexistente", async () => {
      const response = await http.post(`${base}/auth/resend-verification`, {
        json: { email: `nadie-${fresh.username}@kinalsports.test` },
      });
      expect(contract(response)).toMatchSnapshot();
    });

    test("POST /auth/verify-email con token inválido", async () => {
      const response = await http.post(`${base}/auth/verify-email`, {
        json: { token: "invalido" },
      });
      expect(contract(response)).toMatchSnapshot();
    });

    test("POST /auth/verify-email válido", async () => {
      const token = await waitForToken(fresh.email, "verify-email", {
        exclude: previousMails,
      });
      const response = await http.post(`${base}/auth/verify-email`, {
        json: { token },
      });
      expect(contract(response)).toMatchSnapshot();
    });
  });

  describe("sesión", () => {
    test("POST /auth/login sin datos", async () => {
      expect(
        contract(await http.post(`${base}/auth/login`, { json: {} })),
      ).toMatchSnapshot();
    });

    test("POST /auth/login con contraseña incorrecta", async () => {
      const response = await http.post(`${base}/auth/login`, {
        json: { emailOrUsername: fresh.username, password: "Incorrecta123!" },
      });
      expect(contract(response)).toMatchSnapshot();
    });

    test("POST /auth/login válido (usuario en mayúsculas)", async () => {
      const response = await http.post(`${base}/auth/login`, {
        json: {
          emailOrUsername: fresh.username.toUpperCase(),
          password: fresh.password,
        },
      });
      expect(contract(response)).toMatchSnapshot();
      session = {
        token: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      };
      freshUserId = decodeJwt(session.token).sub;
      expect(decodeJwt(session.token).role).toBe("USER_ROLE");
    });

    test("POST /auth/login por correo", async () => {
      const response = await http.post(`${base}/auth/login`, {
        json: { emailOrUsername: fresh.email, password: fresh.password },
      });
      expect(contract(response)).toMatchSnapshot();
    });

    test("GET /auth/profile sin token", async () => {
      expect(
        contract(await http.get(`${base}/auth/profile`)),
      ).toMatchSnapshot();
    });

    test("GET /auth/profile con token inválido", async () => {
      expect(
        contract(await http.get(`${base}/auth/profile`, { token: "x.y.z" })),
      ).toMatchSnapshot();
    });

    test("GET /auth/profile", async () => {
      const response = await http.get(`${base}/auth/profile`, {
        token: session.token,
      });
      expect(contract(response)).toMatchSnapshot();
    });

    test("POST /auth/refresh con token inválido", async () => {
      const response = await http.post(`${base}/auth/refresh`, {
        json: { refreshToken: "invalido" },
      });
      expect(contract(response)).toMatchSnapshot();
    });

    test("POST /auth/refresh válido y conserva el rol", async () => {
      const response = await http.post(`${base}/auth/refresh`, {
        json: { refreshToken: session.refreshToken },
      });
      expect(contract(response)).toMatchSnapshot();
      expect(decodeJwt(response.data.accessToken).role).toBe("USER_ROLE");
      session.oldRefreshToken = session.refreshToken;
      session.refreshToken = response.data.refreshToken;
      session.token = response.data.accessToken;
    });

    test("POST /auth/refresh reutilizando un token ya rotado", async () => {
      const response = await http.post(`${base}/auth/refresh`, {
        json: { refreshToken: session.oldRefreshToken },
      });
      expect(contract(response)).toMatchSnapshot();
    });

    test("POST /auth/logout", async () => {
      const relogin = await http.post(`${base}/auth/login`, {
        json: { emailOrUsername: fresh.username, password: fresh.password },
      });
      session = {
        token: relogin.data.accessToken,
        refreshToken: relogin.data.refreshToken,
      };
      const response = await http.post(`${base}/auth/logout`, {
        json: { refreshToken: session.refreshToken },
      });
      expect(contract(response)).toMatchSnapshot();
    });

    test("POST /auth/refresh después del logout", async () => {
      const response = await http.post(`${base}/auth/refresh`, {
        json: { refreshToken: session.refreshToken },
      });
      expect(contract(response)).toMatchSnapshot();
    });
  });

  describe("foto de perfil", () => {
    test("POST /auth/profile/picture sin token", async () => {
      const response = await http.post(`${base}/auth/profile/picture`, {
        form: { profilePicture: png() },
      });
      expect(contract(response)).toMatchSnapshot();
    });

    test("POST /auth/profile/picture con archivo que no es imagen", async () => {
      const response = await http.post(`${base}/auth/profile/picture`, {
        token: session.token,
        form: { profilePicture: textFile() },
      });
      expect(contract(response)).toMatchSnapshot();
    });

    test("POST /auth/profile/picture válido", async () => {
      const response = await http.post(`${base}/auth/profile/picture`, {
        token: session.token,
        form: { profilePicture: png() },
      });
      expect(contract(response)).toMatchSnapshot();
    });
  });

  describe("consultas internas entre servicios", () => {
    test("POST /auth/profile/by-id sin token interno", async () => {
      const response = await http.post(`${base}/auth/profile/by-id`, {
        json: { userId: freshUserId },
      });
      expect(contract(response)).toMatchSnapshot();
    });

    test("POST /auth/profile/by-id", async () => {
      const response = await http.post(`${base}/auth/profile/by-id`, {
        headers: { "x-internal-token": internalToken },
        json: { userId: freshUserId },
      });
      expect(contract(response)).toMatchSnapshot();
    });

    test("POST /auth/profile/by-id inexistente", async () => {
      const response = await http.post(`${base}/auth/profile/by-id`, {
        headers: { "x-internal-token": internalToken },
        json: { userId: "usr_NoExiste0000" },
      });
      expect(contract(response)).toMatchSnapshot();
    });

    test("POST /auth/profile/by-username", async () => {
      const response = await http.post(`${base}/auth/profile/by-username`, {
        headers: { "x-internal-token": internalToken },
        json: { username: fresh.username },
      });
      expect(contract(response)).toMatchSnapshot();
    });

    test("POST /auth/profile/by-username inexistente", async () => {
      const response = await http.post(`${base}/auth/profile/by-username`, {
        headers: { "x-internal-token": internalToken },
        json: { username: `nadie${fresh.username}` },
      });
      expect(contract(response)).toMatchSnapshot();
    });
  });

  describe("roles", () => {
    test("GET /users/:id/roles", async () => {
      const response = await http.get(`${base}/users/${freshUserId}/roles`, {
        token: session.token,
      });
      expect(contract(response)).toMatchSnapshot();
    });

    test("GET /users/by-role/:role como usuario", async () => {
      const response = await http.get(`${base}/users/by-role/USER_ROLE`, {
        token: session.token,
      });
      expect(contract(response)).toMatchSnapshot();
    });

    test("GET /users/by-role/:role como admin", async () => {
      const response = await http.get(`${base}/users/by-role/ADMIN_ROLE`, {
        token: admin.token,
      });
      expect(contract(response)).toMatchSnapshot();
    });

    test("PUT /users/:id/role como usuario", async () => {
      const response = await http.put(`${base}/users/${freshUserId}/role`, {
        token: session.token,
        json: { roleName: "ADMIN_ROLE" },
      });
      expect(contract(response)).toMatchSnapshot();
    });

    test("PUT /users/:id/role con rol inválido", async () => {
      const response = await http.put(`${base}/users/${freshUserId}/role`, {
        token: admin.token,
        json: { roleName: "SUPER_ROLE" },
      });
      expect(contract(response)).toMatchSnapshot();
    });

    test("PUT /users/:id/role a ADMIN y de vuelta a USER", async () => {
      const promote = await http.put(`${base}/users/${freshUserId}/role`, {
        token: admin.token,
        json: { roleName: "ADMIN_ROLE" },
      });
      expect(contract(promote)).toMatchSnapshot();
      const demote = await http.put(`${base}/users/${freshUserId}/role`, {
        token: admin.token,
        json: { roleName: "USER_ROLE" },
      });
      expect(contract(demote)).toMatchSnapshot();
    });
  });

  describe("recuperación de contraseña", () => {
    test("POST /auth/forgot-password con correo inexistente", async () => {
      const response = await http.post(`${base}/auth/forgot-password`, {
        json: { email: `nadie-${fresh.username}@kinalsports.test` },
      });
      expect(contract(response)).toMatchSnapshot();
    });

    test("POST /auth/reset-password con token inválido", async () => {
      const response = await http.post(`${base}/auth/reset-password`, {
        json: { token: "invalido", newPassword: "Nueva12345!" },
      });
      expect(contract(response)).toMatchSnapshot();
    });

    test("POST /auth/forgot-password y /auth/reset-password", async () => {
      const startedAt = Date.now() - 1_000;
      const forgot = await http.post(`${base}/auth/forgot-password`, {
        json: { email: fresh.email },
      });
      expect(contract(forgot)).toMatchSnapshot();

      const token = await waitForToken(fresh.email, "reset-password", {
        after: startedAt,
      });
      const reset = await http.post(`${base}/auth/reset-password`, {
        json: { token, newPassword: "Nueva12345!" },
      });
      expect(contract(reset)).toMatchSnapshot();

      const relogin = await http.post(`${base}/auth/login`, {
        json: { emailOrUsername: fresh.username, password: "Nueva12345!" },
      });
      expect(relogin.status).toBe(200);
    });
  });

  if (name === "auth-node") {
    test("POST /auth/profile/picture/avatar", async () => {
      const relogin = await login(fresh.username, {
        via,
        password: "Nueva12345!",
      });
      const response = await http.post(`${base}/auth/profile/picture/avatar`, {
        token: relogin.token,
        form: { avatar: png() },
      });
      expect(contract(response)).toMatchSnapshot();
    });
  }

  if (name === "auth-service") {
    test("GET /auth/users como admin", async () => {
      const response = await http.get(`${base}/auth/users`, {
        token: admin.token,
      });
      expect(contract(response)).toMatchSnapshot();
    });

    test("GET /api/v1/health", async () => {
      expect(contract(await http.get(`${base}/health`))).toMatchSnapshot();
    });
  }
});
