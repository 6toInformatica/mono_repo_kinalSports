import "server-only";

/**
 * Configuración del servidor de Next. Las URLs de los backends solo existen aquí:
 * el navegador nunca las ve, porque todas las llamadas pasan por /api.
 */
const required = (name: string) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Falta la variable de entorno ${name} en client-admin-next`,
    );
  }
  return value.replace(/\/+$/, "");
};

export const serverConfig = {
  /** auth-service (.NET), igual que client-admin */
  get authApiUrl() {
    return required("AUTH_API_URL");
  },
  get adminApiUrl() {
    return required("ADMIN_API_URL");
  },
  /**
   * Secure cookies: obligatorio detrás de HTTPS.
   * SECURE_COOKIES=true|false sobrescribe el default (NODE_ENV === "production")
   * para poder probar docker-compose.prod.yml en http://localhost.
   */
  secureCookies:
    process.env.SECURE_COOKIES === "true"
      ? true
      : process.env.SECURE_COOKIES === "false"
        ? false
        : process.env.NODE_ENV === "production",
};

export type BackendService = "auth" | "admin";

export const backendBaseUrl = (service: BackendService) =>
  service === "auth" ? serverConfig.authApiUrl : serverConfig.adminApiUrl;
