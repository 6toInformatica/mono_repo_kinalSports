import {
  type CanActivate,
  type ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

const ROLES_KEY = 'roles';

/** Roles permitidos para la ruta (se usa junto con JwtAuthGuard) */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const allowedRoles = this.reflector.getAllAndOverride<string[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );
    if (!allowedRoles?.length) return true;

    const { user } = context.switchToHttp().getRequest<Request>();
    if (!user) {
      throw new HttpException(
        {
          success: false,
          message: 'Usuario no autenticado',
          error: 'UNAUTHORIZED',
        },
        HttpStatus.UNAUTHORIZED
      );
    }

    if (!allowedRoles.includes(user.role)) {
      throw new HttpException(
        {
          success: false,
          message: 'No tienes permisos para acceder a este recurso',
          error: 'FORBIDDEN',
          requiredRole: allowedRoles,
          yourRole: user.role,
        },
        HttpStatus.FORBIDDEN
      );
    }
    return true;
  }
}
