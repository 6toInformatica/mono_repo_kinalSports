import { Global, Module } from '@nestjs/common';
import { AuthOrInternalGuard } from './auth-or-internal.guard.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { RolesGuard } from './roles.js';
import { TokenService } from './token.service.js';

/** Guards de autenticación y autorización, disponibles para todos los módulos */
@Global()
@Module({
  providers: [TokenService, JwtAuthGuard, AuthOrInternalGuard, RolesGuard],
  exports: [TokenService, JwtAuthGuard, AuthOrInternalGuard, RolesGuard],
})
export class SecurityModule {}
