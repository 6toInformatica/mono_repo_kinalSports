import { Controller, Get, Param, Put, Query, UseGuards } from '@nestjs/common';
import { toHttpError, withDetail } from '../common/http-errors.js';
import { ObjectIdPipe } from '../common/pipes/object-id.pipe.js';
import {
  ADMIN_ROLE,
  type AuthenticatedUser,
} from '../common/security/authenticated-user.js';
import { CurrentUser } from '../common/security/current-user.decorator.js';
import { JwtAuthGuard } from '../common/security/jwt-auth.guard.js';
import { Roles, RolesGuard } from '../common/security/roles.js';
import {
  ReservationService,
  type ListReservationsQuery,
} from './reservation.service.js';

@Controller('reservations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReservationsController {
  constructor(private readonly reservations: ReservationService) {}

  @Get()
  @Roles(ADMIN_ROLE)
  async list(@Query() query: ListReservationsQuery) {
    try {
      const { reservations, pagination } = await this.reservations.list(query);
      return { success: true, data: reservations, pagination };
    } catch (error) {
      throw toHttpError(error, withDetail('Error al obtener las reservas'));
    }
  }

  @Get(':id')
  async getById(
    @Param('id', new ObjectIdPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    try {
      return {
        success: true,
        data: await this.reservations.getById(id, user),
      };
    } catch (error) {
      throw toHttpError(error, withDetail('Error al obtener la reserva'));
    }
  }

  @Put(':id/confirm')
  @Roles(ADMIN_ROLE)
  async confirm(
    @Param('id', new ObjectIdPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    try {
      const reservation = await this.reservations.confirm(
        id,
        user.id || 'admin'
      );
      return {
        success: true,
        message: 'Reserva confirmada exitosamente',
        data: reservation,
      };
    } catch (error) {
      throw toHttpError(error, withDetail('Error al confirmar la reserva'));
    }
  }

  @Put(':id/cancel')
  @Roles(ADMIN_ROLE)
  async cancel(
    @Param('id', new ObjectIdPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    try {
      const reservation = await this.reservations.cancel(
        id,
        user.id || 'admin'
      );
      return {
        success: true,
        message: 'Reserva cancelada exitosamente',
        data: reservation,
      };
    } catch (error) {
      throw toHttpError(error, (e) => ({
        message: e.message || 'Error al cancelar la reserva',
        error: e.message,
      }));
    }
  }
}
