// Imágenes de Cloudinary. Los logos por defecto del backend no existen en Cloudinary:
// en su lugar se muestra la imagen local.
const PLACEHOLDERS = new Set([
  "fields/kinal_sports_nyvxo5",
  "kinal_sports_nyvxo5",
  "kinal_sports/fields/kinal_sports_nyvxo5",
]);

const CLOUDINARY_BASE = (
  process.env.NEXT_PUBLIC_CLOUDINARY_BASE_URL ?? ""
).replace(/\/+$/, "");

export const DEFAULT_LOGO = "/kinal_sports.png";
export const DEFAULT_AVATAR = "/avatar-default.png";

/** URL completa de una imagen guardada (URL o public_id), o null si no hay */
export const resolveImage = (value?: string | null) => {
  const trimmed = value?.trim();
  if (!trimmed || PLACEHOLDERS.has(trimmed)) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return CLOUDINARY_BASE
    ? `${CLOUDINARY_BASE}/${trimmed.replace(/^\/+/, "")}`
    : null;
};
