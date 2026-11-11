export type Errors = Record<string, string>;

export const text = (form: FormData, name: string) =>
  String(form.get(name) ?? "").trim();

/** Quita del FormData un archivo vacío, para no reemplazar la imagen guardada */
export const dropEmptyFile = (form: FormData, name: string) => {
  const file = form.get(name);
  if (file instanceof File && file.size === 0) form.delete(name);
};

export const hasErrors = (errors: Errors) => Object.keys(errors).length > 0;
