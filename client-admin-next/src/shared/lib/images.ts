// Imágenes de Cloudinary. Los logos y avatares por defecto del backend no existen
// en Cloudinary: en su lugar se muestra la imagen local.
const PLACEHOLDERS = new Set([
  "fields/kinal_sports_nyvxo5",
  "kinal_sports_nyvxo5",
  "kinal_sports/fields/kinal_sports_nyvxo5",
  "auth_service/profiles/avatarDefault-1749508519496_oam3k3",
  "avatarDefault-1749508519496_oam3k3",
]);

const DEFAULT_AVATAR_MARKERS = ["avatarDefault", "default_avatar", "nyvxo5"];

const CLOUDINARY_BASE = (
  process.env.NEXT_PUBLIC_CLOUDINARY_BASE_URL ?? ""
).replace(/\/+$/, "");

export const DEFAULT_LOGO = "/kinal_sports.png";
export const DEFAULT_AVATAR = "/avatar-default.png";

/** URL completa de una imagen guardada (URL o public_id), o null si no hay */
export const resolveImage = (value?: string | null) => {
  const trimmed = value?.trim();
  if (
    !trimmed ||
    PLACEHOLDERS.has(trimmed) ||
    DEFAULT_AVATAR_MARKERS.some((marker) => trimmed.includes(marker))
  ) {
    return null;
  }
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return CLOUDINARY_BASE
    ? `${CLOUDINARY_BASE}/${trimmed.replace(/^\/+/, "")}`
    : null;
};
