// Convierte una respuesta HTTP en su "huella de contrato":
// status, si es JSON, y la estructura del body (claves y tipos).
//
// Los valores que forman parte del contrato (success, message, error, status...)
// se conservan, normalizando lo que cambia entre corridas (ids, fechas, nombres).
// Dentro de arreglos solo se conservan tipos, porque su contenido depende de los datos.

import { RUN } from "./fixtures.js";

const KEPT_VALUES = new Set([
  "success",
  "message",
  "error",
  "msg",
  "code",
  "status",
  "role",
  "emailVerificationRequired",
]);

const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

export const normalizeText = (text) =>
  text
    .replaceAll(RUN, "<run>")
    .replace(/\b[0-9a-f]{24}\b/g, "<objectId>")
    .replace(/\busr_[A-Za-z0-9]{12}\b/g, "<userId>")
    .replace(/\b[\w.+-]+@[\w-]+(\.[\w-]+)+\b/g, "<email>")
    .replace(
      /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?/g,
      "<date>",
    )
    .replace(/\b\d+(\.\d+)?\b/g, "<n>");

// Une varias huellas (los elementos de un arreglo) en una sola
function merge(shapes) {
  const objects = shapes.filter(isPlainObject);
  const arrays = shapes.filter(Array.isArray);
  const scalars = [
    ...new Set(shapes.filter((s) => typeof s === "string")),
  ].sort();

  let objectShape;
  if (objects.length) {
    const keys = [...new Set(objects.flatMap(Object.keys))].sort();
    objectShape = {};
    for (const key of keys) {
      objectShape[key] = merge(
        objects.filter((o) => key in o).map((o) => o[key]),
      );
    }
  }

  let arrayShape;
  if (arrays.length) {
    const items = arrays.flat();
    arrayShape = items.length ? [merge(items)] : [];
  }

  const kinds = [objectShape, arrayShape].filter((k) => k !== undefined);
  if (!kinds.length) return scalars.join("|");
  if (!scalars.length && kinds.length === 1) return kinds[0];
  return { "@oneOf": [...scalars, ...kinds] };
}

export function shape(value, key = "", inArray = false) {
  if (value === null) return "null";
  if (Array.isArray(value)) {
    return value.length
      ? [merge(value.map((item) => shape(item, "", true)))]
      : [];
  }
  if (isPlainObject(value)) {
    const result = {};
    for (const k of Object.keys(value).sort())
      result[k] = shape(value[k], k, inArray);
    return result;
  }
  if (!inArray && KEPT_VALUES.has(key)) {
    return typeof value === "string" ? normalizeText(value) : value;
  }
  return typeof value;
}

// Huella completa de una respuesta del cliente HTTP
export const contract = (response) => ({
  status: response.status,
  json: response.contentType.includes("json"),
  body: typeof response.data === "string" ? "text" : shape(response.data),
});
