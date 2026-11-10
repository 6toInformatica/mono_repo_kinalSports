import multer from 'multer';

const MIMETYPES = [
  'image/jpeg',
  'image/png',
  'image/jpg',
  'image/webp',
  'image/avif',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Recibe la imagen en memoria (sin tocar el disco). El servicio que la necesita
 * decide dónde subirla (Cloudinary o el servicio de auth).
 */
export const imageUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (MIMETYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        Object.assign(
          new Error(`Solo se permiten imágenes: ${MIMETYPES.join(', ')}`),
          { statusCode: 400 }
        )
      );
    }
  },
  limits: { fileSize: MAX_FILE_SIZE },
});
