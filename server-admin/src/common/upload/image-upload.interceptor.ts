import {
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
  mixin,
  type Type,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import multer from 'multer';
import { from, switchMap } from 'rxjs';

const MIMETYPES = [
  'image/jpeg',
  'image/png',
  'image/jpg',
  'image/webp',
  'image/avif',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Recibe una imagen opcional en memoria (campo `fieldName`). Todavía no se sube a
 * Cloudinary: lo hace el servicio después de autorizar y validar la petición, así un
 * error ya no deja imágenes huérfanas.
 * Los errores de multer llegan intactos al filtro global (400 como antes).
 */
export const ImageUpload = (fieldName: string): Type<NestInterceptor> => {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (_req, file, cb) => {
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
  }).single(fieldName);

  class ImageUploadInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler) {
      const http = context.switchToHttp();
      const req = http.getRequest<Request>();
      const res = http.getResponse<Response>();

      const parsed = new Promise<void>((resolve, reject) =>
        upload(req, res, (error?: unknown) =>
          error ? reject(error) : resolve()
        )
      );
      return from(parsed).pipe(switchMap(() => next.handle()));
    }
  }
  return mixin(ImageUploadInterceptor);
};

export type UploadedImage = Express.Multer.File;
