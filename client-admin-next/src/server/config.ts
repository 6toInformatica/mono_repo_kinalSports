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
  /** En producción las cookies solo viajan por HTTPS */
  secureCookies: process.env.NODE_ENV === "production",
};

export type BackendService = "auth" | "admin";

export const backendBaseUrl = (service: BackendService) =>
  service === "auth" ? serverConfig.authApiUrl : serverConfig.adminApiUrl;
