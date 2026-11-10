import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import type { Env } from '../config/env.validation.js';

/** Imágenes de canchas, equipos y torneos en Cloudinary */
@Injectable()
export class CloudinaryService {
  constructor(config: ConfigService<Env, true>) {
    cloudinary.config({
      cloud_name: config.get('CLOUDINARY_CLOUD_NAME', { infer: true }),
      api_key: config.get('CLOUDINARY_API_KEY', { infer: true }),
      api_secret: config.get('CLOUDINARY_API_SECRET', { infer: true }),
    });
  }

  /**
   * Sube la imagen (en memoria) y devuelve el resultado; su `secure_url` es lo que se
   * guarda. El public_id es el nombre original normalizado más un sufijo aleatorio.
   */
  upload(
    file: { buffer: Buffer; originalname: string },
    folder: string
  ): Promise<UploadApiResponse> {
    const fileExt = extname(file.originalname);
    const baseName = file.originalname
      .replace(fileExt, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-+|-+$/g, '');
    const publicId = `${baseName}-${randomUUID().substring(0, 8)}`;

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: publicId,
          allowed_formats: ['jpeg', 'jpg', 'png', 'webp', 'avif'],
          transformation: [{ width: 1000, height: 1000, crop: 'limit' }],
          resource_type: 'image',
        },
        (error, result) => (error || !result ? reject(error) : resolve(result))
      );
      stream.end(file.buffer);
    });
  }

  /** Borra una imagen; un fallo se registra pero no interrumpe la operación */
  async destroy(publicId: string) {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error(
        `Error al eliminar imagen de Cloudinary: ${(error as Error).message}`
      );
    }
  }

  /**
   * public_id de una imagen guardada (URL completa), suponiendo que está en `folder`.
   * Así la calculaba la versión anterior para reemplazar imágenes.
   */
  publicIdFromUrl(url: string, folder: string) {
    const fileName = url.split('/').pop() ?? '';
    return `${folder}/${fileName.split('.')[0]}`;
  }
}
