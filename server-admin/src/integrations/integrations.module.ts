import { Global, Module } from '@nestjs/common';
import { AuthClientService } from './auth-client.service.js';
import { CloudinaryService } from './cloudinary.service.js';

/** Servicios externos: auth (perfiles de usuario) y Cloudinary (imágenes) */
@Global()
@Module({
  providers: [AuthClientService, CloudinaryService],
  exports: [AuthClientService, CloudinaryService],
})
export class IntegrationsModule {}
