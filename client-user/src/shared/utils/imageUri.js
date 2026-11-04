/**
 * Devuelve la URI solo si es una URL remota válida (http/https).
 * Los placeholders del backend (ej. "fields/kinal_sports_nyvxo5") o public_id sueltos
 * no son cargables por <Image>, así que se devuelve null para que la pantalla use su fallback.
 * @param {string | null | undefined} value
 * @returns {string | null}
 */
export const resolveRemoteImage = (value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return null;
};
