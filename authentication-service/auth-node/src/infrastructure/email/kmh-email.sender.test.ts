import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createKmhEmailSender } from './kmh-email.sender.ts';

const kmh = {
  baseUrl: 'https://mail.test/',
  from: 'kinal-sports@am-delta.test',
  apiKey: 'kmh_live_test' as string | undefined,
  timeoutMs: 1000,
};

const mockFetch = (status = 201, body: unknown = { correlationId: 'abc' }) => {
  const fetchMock = vi.fn(
    async (
      _url: string,
      _init: RequestInit & { headers: Record<string, string> }
    ) => new Response(JSON.stringify(body), { status })
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

describe('createKmhEmailSender', () => {
  beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('envía al gateway con Bearer, Idempotency-Key y texto plano', async () => {
    const fetchMock = mockFetch();
    const sender = createKmhEmailSender(kmh, 'http://localhost:3000');

    await sender.sendVerification('andrea@kinalsports.gt', 'Andrea', 'tok123');

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://mail.test/api/v1/messages');
    expect(init.headers.Authorization).toBe('Bearer kmh_live_test');
    expect(init.headers['Idempotency-Key']).toMatch(/^[0-9a-f-]{36}$/);
    const body = JSON.parse(init.body as string);
    expect(body).toMatchObject({
      from: 'kinal-sports@am-delta.test',
      to: ['andrea@kinalsports.gt'],
      subject: 'Verifica tu correo electrónico - Kinal Sports',
    });
    expect(body.html).toContain(
      'http://localhost:3000/verify-email?token=tok123'
    );
    // El enlace se conserva en el texto plano y no quedan etiquetas
    expect(body.text).toContain(
      'Verificar correo: http://localhost:3000/verify-email?token=tok123'
    );
    expect(body.text).not.toMatch(/<[^>]+>/);
  });

  it('usa una Idempotency-Key distinta en cada envío', async () => {
    const fetchMock = mockFetch();
    const sender = createKmhEmailSender(kmh, '');

    await sender.sendWelcome('a@kinal.gt', 'A');
    await sender.sendWelcome('a@kinal.gt', 'A');

    const [first, second] = fetchMock.mock.calls.map(
      ([, init]) => init.headers['Idempotency-Key']
    );
    expect(first).not.toBe(second);
  });

  it('lanza un error con el status si el gateway lo rechaza', async () => {
    mockFetch(401, { error: 'invalid key' });
    const sender = createKmhEmailSender(kmh, '');

    await expect(sender.sendWelcome('a@kinal.gt', 'A')).rejects.toThrow(
      /respondió 401/
    );
  });

  it('sin API key falla sin llamar al gateway', async () => {
    const fetchMock = mockFetch();
    const sender = createKmhEmailSender({ ...kmh, apiKey: undefined }, '');

    await expect(sender.sendWelcome('a@kinal.gt', 'A')).rejects.toThrow(
      'API key not configured'
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
