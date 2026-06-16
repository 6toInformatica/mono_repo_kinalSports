import defaultAvatarImg from '../../assets/img/avatarDefault-1749508519496.png';

const DEFAULT_MARKERS = ['avatarDefault', 'default_avatar', 'nyvxo5'];

/**
 * Resuelve la URL del avatar del usuario para mostrar en el admin.
 * @param {string | null | undefined} value
 * @param {string} [fallback]
 * @returns {string}
 */
export const resolveAvatarUrl = (value, fallback = defaultAvatarImg) => {
  const trimmed = value?.trim();
  if (!trimmed) return fallback;

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  const base = import.meta.env.VITE_CLOUDINARY_BASE_URL?.replace(/\/+$/, '');
  if (!base) return fallback;

  return `${base}/${trimmed.replace(/^\/+/, '')}`;
};

export const isDefaultAvatarUrl = (value) => {
  if (!value || typeof value !== 'string') return true;
  const trimmed = value.trim();
  if (!trimmed) return true;
  return DEFAULT_MARKERS.some((marker) => trimmed.includes(marker));
};

export { defaultAvatarImg };
