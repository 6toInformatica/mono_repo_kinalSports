import { randomUUID } from 'node:crypto';
import type { AppConfig } from '../../config/env.ts';
import type { EmailSender } from '../../modules/auth/application/ports.ts';
import { createTemplatedEmailSender } from './templates.ts';

/** Versión en texto plano del HTML (campo `text` del gateway) */
const toPlainText = (html: string) =>
  html
    .replace(
      /<a\s[^>]*href=['"]([^'"]+)['"][^>]*>\s*([\s\S]*?)\s*<\/a>/gi,
      '$2: $1'
    )
    .replace(/<[^>]+>/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');

/**
 * Envío por Kinal Mail Hub: POST {baseUrl}/api/v1/messages con la API key del proyecto.
 * Sin API key el servicio arranca igual, pero cada envío falla.
 */
export const createKmhEmailSender = (
  kmh: AppConfig['kmh'],
  frontendUrl: string
): EmailSender => {
  if (!kmh.apiKey) {
    console.warn(
      'KMH_PROJECT_API_KEY not configured. Email functionality will not work.'
    );
  }

  const endpoint = `${kmh.baseUrl.replace(/\/+$/, '')}/api/v1/messages`;

  const send = async (to: string, subject: string, html: string) => {
    if (!kmh.apiKey) throw new Error('Kinal Mail Hub API key not configured');

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${kmh.apiKey}`,
        'Idempotency-Key': randomUUID(),
      },
      body: JSON.stringify({
        from: kmh.from,
        to: [to],
        subject,
        html,
        text: toPlainText(html),
      }),
      signal: AbortSignal.timeout(kmh.timeoutMs),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(
        `Kinal Mail Hub respondió ${response.status}${detail ? `: ${detail.slice(0, 300)}` : ''}`
      );
    }

    const data = (await response.json().catch(() => ({}))) as {
      correlationId?: string;
      status?: string;
    };
    console.info(
      `Email accepted by Kinal Mail Hub (correlationId=${data.correlationId ?? 'n/a'}, status=${data.status ?? 'n/a'})`
    );
  };

  return createTemplatedEmailSender(send, frontendUrl);
};
