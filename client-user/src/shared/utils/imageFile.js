export const IMAGE_MAX_BYTES = 10 * 1024 * 1024;

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const mimeFromName = (name) => {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png" || ext === "webp" || ext === "avif") return `image/${ext}`;
  return "";
};

/** null si la imagen del dispositivo puede enviarse. */
export const imageAssetError = (asset) => {
  if (!asset) return null;
  const mime =
    asset.mimeType || mimeFromName(asset.fileName || asset.uri || "");
  if (mime && !ALLOWED_IMAGE_MIME_TYPES.has(mime)) {
    return "Formato no permitido. Usa JPG, PNG, WEBP o AVIF.";
  }
  if (typeof asset.fileSize === "number" && asset.fileSize > IMAGE_MAX_BYTES) {
    return "La imagen supera los 10 MB.";
  }
  return null;
};
