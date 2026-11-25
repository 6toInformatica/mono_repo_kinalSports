const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

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
  if (!file || !ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
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
