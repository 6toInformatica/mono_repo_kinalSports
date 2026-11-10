import {
  type CanActivate,
  type ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { TokenService } from './token.service.js';

const unauthorized = (message: string, error: string) =>
  new HttpException(
    { success: false, message, error },
    HttpStatus.UNAUTHORIZED
  );

/** Exige un JWT válido de usuario y deja su identidad en req.user */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly tokens: TokenService) {}

  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    const token = this.tokens.extractToken(req);

    if (!token) {
      throw unauthorized('No se proporcionó un token', 'MISSING_TOKEN');
    }

    try {
      req.user = this.tokens.verifyUser(token);
      return true;
    } catch (error) {
      const { name, message } = error as Error;
      console.error('Error de validación JWT:', message);

      if (name === 'TokenExpiredError') {
        throw unauthorized('El token ha expirado', 'TOKEN_EXPIRED');
      }
      if (name === 'JsonWebTokenError') {
        throw unauthorized('Token inválido', 'INVALID_TOKEN');
      }
      throw new HttpException(
        {
          success: false,
          message: 'Error al validar el token',
          error: 'TOKEN_VALIDATION_ERROR',
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
