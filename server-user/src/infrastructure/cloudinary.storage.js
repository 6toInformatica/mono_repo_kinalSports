'use strict';

import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Sube una imagen en memoria a Cloudinary y devuelve el resultado (secure_url, public_id...).
 * El public_id se forma con el nombre original normalizado y un sufijo aleatorio.
 */
export const uploadImage = (buffer, folder, originalName) =>
  new Promise((resolve, reject) => {
    const fileExt = extname(originalName);
    const baseName = originalName
      .replace(fileExt, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-+|-+$/g, '');
    const publicId = `${baseName}-${randomUUID().substring(0, 8)}`;

    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        allowed_formats: ['jpeg', 'jpg', 'png', 'webp', 'avif'],
        transformation: [{ width: 1000, height: 1000, crop: 'limit' }],
        resource_type: 'image',
      },
      (error, result) => (error ? reject(error) : resolve(result))
    );

    stream.end(buffer);
  });
