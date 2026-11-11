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

// Espera un correo para `to` cuyo asunto o cuerpo contenga `pathFragment` y devuelve el token del enlace
export async function waitForToken(
  to,
  pathFragment,
  { timeoutMs = 15_000, after = 0 } = {},
) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    for (const summary of await findMessages(to)) {
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
