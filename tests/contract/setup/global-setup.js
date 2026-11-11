/* global AbortSignal */
// Comprueba que el entorno de pruebas esté listo y obtiene el token interno entre servicios
import { execFileSync } from "node:child_process";
import { urls } from "../lib/config.js";

const healthChecks = [
  ["auth-node", `${urls.authNode}/health`],
  ["auth-service", `${urls.authServiceRoot}/health`],
  ["server-admin", `${urls.admin}/health`],
  ["server-user", `${urls.user}/health`],
  ["mailpit", `${urls.mailpit}/api/v1/info`],
];

const readInternalToken = () => {
  if (process.env.CONTRACT_INTERNAL_TOKEN)
    return process.env.CONTRACT_INTERNAL_TOKEN;
  try {
    return execFileSync(
      "docker",
      ["exec", "kinal_auth_node", "printenv", "INTERNAL_SERVICE_TOKEN"],
      {
        encoding: "utf8",
      },
    ).trim();
  } catch {
    throw new Error(
      "No se pudo leer INTERNAL_SERVICE_TOKEN. Define CONTRACT_INTERNAL_TOKEN o levanta el stack con Docker.",
    );
  }
};

export default async function setup({ provide }) {
  const failures = [];
  for (const [name, url] of healthChecks) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(5_000) });
      if (!response.ok) failures.push(`${name} (${response.status})`);
    } catch {
      failures.push(`${name} (sin respuesta)`);
    }
  }
  if (failures.length) {
    throw new Error(
      `Servicios no disponibles: ${failures.join(", ")}.\nLevanta el entorno con "pnpm contract:up" y carga datos con "pnpm db:seed".`,
    );
  }
  provide("internalToken", readInternalToken());
}
