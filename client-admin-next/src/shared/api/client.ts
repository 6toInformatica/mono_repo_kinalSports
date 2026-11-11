/**
 * Cliente del navegador. Solo habla con las rutas de este mismo sitio (/api/...):
 * los tokens viven en cookies httpOnly y el servidor de Next los agrega a cada llamada.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly data: unknown,
  ) {
    super(message);
  }
}

type Service = "auth" | "admin";

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Objeto (se envía como JSON) o FormData (multipart, con imágenes) */
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
}

export const SESSION_EXPIRED_EVENT = "kinal:session-expired";
const SESSION_EXPIRED = "Tu sesión expiró. Inicia sesión de nuevo.";

const toQuery = (query: RequestOptions["query"]) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) params.set(key, String(value));
  }
  const text = params.toString();
  return text ? `?${text}` : "";
};

export async function request<T>(url: string, options: RequestOptions = {}) {
  const { method = "GET", body, query } = options;
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;

  const response = await fetch(`${url}${toQuery(query)}`, {
    method,
    headers:
      body && !isForm ? { "Content-Type": "application/json" } : undefined,
    body: isForm ? (body as FormData) : body ? JSON.stringify(body) : undefined,
    credentials: "same-origin",
  });

  // La sesión no se pudo renovar: SessionWatcher lleva de vuelta al login
  if (response.headers.get("x-session-expired")) {
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    throw new ApiError(SESSION_EXPIRED, 401, null);
  }

  const data = (await response.json().catch(() => null)) as
    (T & { message?: string }) | null;
  if (!response.ok) {
    throw new ApiError(
      data?.message ?? "Ocurrió un error inesperado",
      response.status,
      data,
    );
  }
  return data as T;
}

/** Llamada a un backend a través del proxy de Next */
export const api = <T>(
  service: Service,
  path: string,
  options?: RequestOptions,
) => request<T>(`/api/backend/${service}/${path.replace(/^\/+/, "")}`, options);
