import type { UploadedFile } from '../http/upload.ts';
import type { UserWithRelations } from '../modules/users/infrastructure/user.repository.ts';

declare module 'fastify' {
  interface FastifyRequest {
    /** Usuario autenticado (lo asigna el hook authenticate) */
    user: UserWithRelations | null;
    userId: string | null;
    /** Archivo recibido en un formulario multipart (hook singleFileUpload) */
    uploadedFile: UploadedFile | null;
  }
}
