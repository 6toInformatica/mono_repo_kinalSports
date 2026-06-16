const PLACEHOLDER_LOGOS = new Set([
  'fields/kinal_sports_nyvxo5',
  'kinal_sports_nyvxo5',
  'kinal_sports/fields/kinal_sports_nyvxo5',
]);

const isPlaceholderLogo = (value) => PLACEHOLDER_LOGOS.has(value?.trim());

/**
 * Resuelve un public_id o URL de Cloudinary a una URL de imagen completa.
 * Los logos por defecto del backend no existen en Cloudinary y devuelven fallback.
 * @param {string | null | undefined} value
 * @param {string | null} [fallback]
 * @returns {string | null}
 */
export const resolveCloudinaryUrl = (value, fallback = null) => {
  const trimmed = value?.trim();
  if (!trimmed || isPlaceholderLogo(trimmed)) return fallback;

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  const base = import.meta.env.VITE_CLOUDINARY_BASE_URL?.replace(/\/+$/, '');
  if (!base || base.includes('/example/')) return fallback;

  return `${base}/${trimmed.replace(/^\/+/, '')}`;
};
