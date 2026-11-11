// Cliente HTTP mínimo sobre fetch nativo.
// `form` acepta valores simples o archivos con la forma { buffer, type, name }.

const isFile = (value) =>
  value && typeof value === "object" && Buffer.isBuffer(value.buffer);

const buildForm = (fields) => {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    if (isFile(value)) {
      form.append(
        key,
        new Blob([value.buffer], { type: value.type }),
        value.name,
      );
    } else {
      form.append(
        key,
        typeof value === "string" ? value : JSON.stringify(value),
      );
    }
  }
  return form;
};

export async function request(method, url, options = {}) {
  const { token, json, form, headers = {} } = options;
  const finalHeaders = { ...headers };
  let body;

  if (token) finalHeaders.Authorization = `Bearer ${token}`;
  if (json !== undefined) {
    finalHeaders["Content-Type"] = "application/json";
    body = typeof json === "string" ? json : JSON.stringify(json);
  } else if (form) {
    body = buildForm(form);
  }

  const response = await fetch(url, { method, headers: finalHeaders, body });
  const text = await response.text();
  const contentType = response.headers.get("content-type") || "";
  let data = text;
  if (contentType.includes("json")) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  return { status: response.status, contentType, data };
}

export const http = {
  get: (url, options) => request("GET", url, options),
  post: (url, options) => request("POST", url, options),
  put: (url, options) => request("PUT", url, options),
  delete: (url, options) => request("DELETE", url, options),
};
