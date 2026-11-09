import { randomUUID } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import type { preHandlerAsyncHookHandler } from 'fastify';
import type { AppConfig } from '../config/env.ts';
import { HttpResponseError } from './plugins/error-handler.ts';

export interface UploadedFile {
  /** Ruta del archivo temporal en disco */
  path: string;
  originalName: string;
  mimeType: string;
}

const isFileTooLarge = (error: unknown) =>
  (error as { code?: string }).code === 'FST_REQ_FILE_TOO_LARGE';

/**
 * Lee un formulario multipart con un solo archivo opcional en `fieldName`.
 * Los campos de texto quedan en request.body y el archivo en request.uploadedFile,
 * guardado temporalmente en UPLOAD_PATH. Mismas validaciones y respuestas que multer:
 * tipo de imagen permitido, 5 MB máximo y ningún otro campo de archivo.
 * Si la petición no es multipart, el cuerpo (JSON o urlencoded) se deja igual.
 */
export const singleFileUpload =
  (config: AppConfig, fieldName: string): preHandlerAsyncHookHandler =>
  async (request) => {
    if (!request.isMultipart()) return;

    const { upload } = config;
    const fields: Record<string, string> = {};
    let saved: UploadedFile | undefined;

    try {
      for await (const part of request.parts()) {
        if (part.type === 'field') {
          fields[part.fieldname] = String(part.value);
          continue;
        }

        if (part.fieldname !== fieldName || saved) {
          part.file.resume();
          throw new HttpResponseError(400, {
            success: false,
            message: 'Campo de archivo inesperado',
            error: 'Unexpected field',
          });
        }

        if (!upload.allowedTypes.includes(part.mimetype)) {
          part.file.resume();
          throw new HttpResponseError(400, {
            success: false,
            message: 'Tipo de archivo no permitido',
            error: 'Solo se permiten imágenes (JPEG, JPG, PNG, GIF)',
          });
        }

        await mkdir(upload.path, { recursive: true });
        const filePath = path.join(
          upload.path,
          `${randomUUID()}${path.extname(part.filename)}`
        );
        saved = {
          path: filePath,
          originalName: part.filename,
          mimeType: part.mimetype,
        };
        await pipeline(part.file, createWriteStream(filePath));
      }
    } catch (error) {
      if (saved) await rm(saved.path, { force: true });

      if (isFileTooLarge(error)) {
        throw new HttpResponseError(400, {
          success: false,
          message: 'El archivo es demasiado grande',
          error: `El tamaño máximo permitido es ${upload.maxSize / (1024 * 1024)}MB`,
        });
      }
      throw error;
    }

    request.body = fields;
    request.uploadedFile = saved ?? null;
  };
