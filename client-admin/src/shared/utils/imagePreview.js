export const IMAGE_MAX_BYTES = 10 * 1024 * 1024;

export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
]);

/** null si el archivo puede enviarse. Un archivo vacío es opcional. */
export const imageFileError = (file) => {
  if (!file || file.size === 0) return null;
  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
    return 'Formato no permitido. Usa JPG, PNG, WEBP o AVIF.';
  }
  if (file.size > IMAGE_MAX_BYTES) {
    return 'La imagen supera los 10 MB.';
  }
  return null;
};

export const sanitizeImageSrc = (url) => {
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('/')) return url;
  if (/^data:image\/(jpeg|png|webp|avif);base64,[A-Za-z0-9+/=]+$/.test(url)) {
    return url;
  }
  try {
    const parsed = new URL(
      url,
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
    );
    if (
      parsed.protocol === 'https:' ||
      parsed.protocol === 'http:' ||
      parsed.protocol === 'blob:'
    ) {
      return parsed.href;
    }
  } catch {
    return null;
  }
  return null;
};

export const readImageFilePreview = (file, setPreview) => {
  if (imageFileError(file)) {
    setPreview(null);
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === 'string') {
      setPreview(reader.result);
    }
  };
  reader.readAsDataURL(file);
};
