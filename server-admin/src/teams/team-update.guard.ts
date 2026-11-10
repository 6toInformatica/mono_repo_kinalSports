import {
  type CanActivate,
  type ExecutionContext,
  HttpException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { isObjectIdString } from '../common/pipes/object-id.pipe.js';
import {
  ADMIN_ROLE,
  USER_ROLE,
} from '../common/security/authenticated-user.js';
import { TeamService } from './team.service.js';

const deny = (status: number, body: Record<string, unknown>) =>
  new HttpException({ success: false, ...body }, status);

/**
 * Quién puede editar un equipo: el admin cualquiera; un usuario solo el suyo (capitán).
 * Va después de JwtAuthGuard y antes de recibir el logo.
 */
@Injectable()
export class TeamUpdateGuard implements CanActivate {
  constructor(private readonly teams: TeamService) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    const { user } = req;

    if (!user) {
      throw deny(401, {
        message: 'Usuario no autenticado',
        error: 'UNAUTHORIZED',
      });
    }
    if (user.role === ADMIN_ROLE) return true;
    if (user.role !== USER_ROLE) {
      throw deny(403, {
        message: 'No tienes permisos para actualizar equipos',
        error: 'FORBIDDEN',
      });
    }

    // Un id inválido lo responde la validación de la ruta (400)
    const id = String(req.params.id);
    if (!isObjectIdString(id)) return true;

    try {
      const team = await this.teams.findManager(id);
      if (!team) throw deny(404, { message: 'Equipo no encontrado' });
      if (team.managerId !== user.id) {
        throw deny(403, {
          message: 'Solo puedes actualizar tu propio equipo',
          error: 'FORBIDDEN',
        });
      }
      return true;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw deny(500, {
        message: 'Error al validar permisos de actualización',
        error: (error as Error).message,
      });
    }
  }
}
