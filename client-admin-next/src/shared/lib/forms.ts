export type Errors = Record<string, string>;

export const text = (form: FormData, name: string) =>
  String(form.get(name) ?? "").trim();

export const IMAGE_MAX_BYTES = 10 * 1024 * 1024;

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

/** null si el archivo puede enviarse. Un archivo vacío es opcional. */
export const imageFieldError = (value: unknown): string | null => {
  if (!(value instanceof File) || value.size === 0) return null;
  if (!ALLOWED_IMAGE_MIME_TYPES.has(value.type)) {
    return "Formato no permitido. Usa JPG, PNG, WEBP o AVIF.";
  }
  if (value.size > IMAGE_MAX_BYTES) return "La imagen supera los 10 MB.";
  return null;
};

export const assignImageError = (
  errors: Errors,
  form: FormData,
  name: string,
) => {
  const message = imageFieldError(form.get(name));
  if (message) errors[name] = message;
};

/** Quita del FormData un archivo vacío, para no reemplazar la imagen guardada */
export const dropEmptyFile = (form: FormData, name: string) => {
  const file = form.get(name);
  if (file instanceof File && file.size === 0) form.delete(name);
};

export const hasErrors = (errors: Errors) => Object.keys(errors).length > 0;
