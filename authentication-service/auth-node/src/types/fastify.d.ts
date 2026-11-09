import type { UploadedFile } from '../http/upload.ts';
import type { LegacyUser } from '../legacy/index.ts';

declare module 'fastify' {
  interface FastifyRequest {
    /** Usuario autenticado (lo asigna el hook authenticate) */
    user: LegacyUser | null;
    userId: string | null;
    /** Archivo recibido en un formulario multipart (hook singleFileUpload) */
    uploadedFile: UploadedFile | null;
  }
}
