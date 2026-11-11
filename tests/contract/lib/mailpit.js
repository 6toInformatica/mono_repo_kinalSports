// Lectura de correos capturados por Mailpit (solo en el entorno de pruebas)
import { setTimeout as sleep } from "node:timers/promises";
import { urls } from "./config.js";

async function findMessages(to) {
  const query = encodeURIComponent(`to:"${to}"`);
  const response = await fetch(`${urls.mailpit}/api/v1/search?query=${query}`);
  if (!response.ok) throw new Error(`Mailpit respondió ${response.status}`);
  const { messages = [] } = await response.json();
  return messages;
}

/** IDs de los correos ya recibidos para `to` (para ignorarlos después con `exclude`) */
export const messageIds = async (to) =>
  new Set((await findMessages(to)).map((message) => message.ID));

// Espera un correo para `to` cuyo asunto o cuerpo contenga `pathFragment` y devuelve el token del enlace.
// `exclude` descarta correos anteriores: un envío en segundo plano puede llegar después de otro más nuevo.
export async function waitForToken(
  to,
  pathFragment,
  { timeoutMs = 15_000, after = 0, exclude = new Set() } = {},
) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    for (const summary of await findMessages(to)) {
      if (exclude.has(summary.ID)) continue;
      if (new Date(summary.Created).getTime() < after) continue;
      const response = await fetch(
        `${urls.mailpit}/api/v1/message/${summary.ID}`,
      );
      const message = await response.json();
      const content = `${message.HTML || ""}\n${message.Text || ""}`;
      const match = content.match(
        new RegExp(`${pathFragment}\\?token=([^"'&\\s<]+)`),
      );
      if (match) return decodeURIComponent(match[1]);
    }
    await sleep(500);
  }
  throw new Error(`No llegó el correo de ${pathFragment} para ${to}`);
}
