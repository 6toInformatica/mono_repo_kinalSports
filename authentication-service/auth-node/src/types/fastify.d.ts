import type { UploadedFile } from '../http/upload.ts';
import type { User } from '../modules/users/domain/user.ts';

declare module 'fastify' {
  interface FastifyRequest {
    /** Usuario autenticado (lo asigna el hook authenticate) */
    user: User | null;
    userId: string | null;
    /** Archivo recibido en un formulario multipart (hook singleFileUpload) */
    uploadedFile: UploadedFile | null;
  }
}
