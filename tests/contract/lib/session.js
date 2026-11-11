// Inicio de sesión de los usuarios de prueba, con caché por servicio
import { http } from "./http.js";
import { PASSWORD, urls } from "./config.js";

const cache = new Map();

export async function login(
  username,
  { via = "authService", password = PASSWORD } = {},
) {
  const key = `${via}:${username}:${password}`;
  if (cache.has(key)) return cache.get(key);

  const response = await http.post(`${urls[via]}/auth/login`, {
    json: { emailOrUsername: username, password },
  });
  if (response.status !== 200) {
    throw new Error(
      `No se pudo iniciar sesión como ${username} en ${via}: ${response.status} ${JSON.stringify(response.data)}`,
    );
  }
  const session = {
    token: response.data.accessToken,
    refreshToken: response.data.refreshToken,
    user: response.data.userDetails,
  };
  cache.set(key, session);
  return session;
}
