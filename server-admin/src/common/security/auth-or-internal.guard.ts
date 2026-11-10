import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { INTERNAL_SERVICE_USER } from './authenticated-user.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { TokenService } from './token.service.js';

/**
 * Acceso para otros servicios (x-internal-token válido) o para usuarios con JWT.
 * Lo usan las consultas que server-user hace a server-admin.
 */
@Injectable()
export class AuthOrInternalGuard implements CanActivate {
  constructor(
    private readonly tokens: TokenService,
    private readonly jwtGuard: JwtAuthGuard
  ) {}

  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    if (this.tokens.isValidInternalToken(req.header('x-internal-token'))) {
      req.user = INTERNAL_SERVICE_USER;
      return true;
    }
    return this.jwtGuard.canActivate(context);
  }
}
