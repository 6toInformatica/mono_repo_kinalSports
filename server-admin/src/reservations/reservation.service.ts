import { Injectable } from '@nestjs/common';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../common/errors.js';
import {
  ADMIN_ROLE,
  type AuthenticatedUser,
} from '../common/security/authenticated-user.js';
import { ReservationEnricher } from './reservation.enricher.js';
import {
  ReservationRepository,
  type ReservationFilter,
} from './reservation.repository.js';
import type { Reservation } from './schemas/reservation.schema.js';

export interface ListReservationsQuery {
  page?: string | number;
  limit?: string | number;
  status?: string;
  fieldId?: string;
  date?: string;
  userId?: string;
}

const CANCELLABLE_STATUSES = ['PENDING', 'CONFIRMED'];

@Injectable()
export class ReservationService {
  constructor(
    private readonly reservations: ReservationRepository,
    private readonly enricher: ReservationEnricher
  ) {}

  /** Reservas con filtros y paginación (panel admin) */
  async list({
    page = 1,
    limit = 10,
    status,
    fieldId,
    date,
    userId,
  }: ListReservationsQuery) {
    const filter: ReservationFilter = {};
    if (status) filter.status = status as Reservation['status'];
    if (fieldId) filter.fieldId = fieldId;
    if (userId) filter.userId = userId;

    // Día completo de la fecha indicada
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      filter.startTime = { $gte: startDate, $lt: endDate };
    }

    const pageNumber = parseInt(String(page));
    const limitNumber = parseInt(String(limit));

    const { items, total } = await this.reservations.findPage(filter, {
      skip: (pageNumber - 1) * limitNumber,
      limit: limitNumber,
    });

    return {
      reservations: await this.enricher.enrichMany(items),
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(total / limitNumber),
        totalRecords: total,
        limit: limitNumber,
      },
    };
  }

  /** Detalle: solo el admin o el dueño de la reserva */
  async getById(id: string, user: AuthenticatedUser) {
    const reservation = await this.reservations.findByIdWithField(id);
    if (!reservation) throw new NotFoundError('Reserva no encontrada');

    if (user.role !== ADMIN_ROLE && reservation.userId !== user.id) {
      throw new ForbiddenError('No tienes permisos para ver esta reserva', {
        error: 'FORBIDDEN',
      });
    }

    return this.enricher.enrichOne(reservation);
  }

  /** El admin confirma una reserva pendiente y futura cuyo horario sigue libre */
  async confirm(id: string, adminId: string) {
    const reservation = await this.reservations.findById(id);
    if (!reservation) throw new NotFoundError('Reserva no encontrada');

    const conflicts = await this.reservations.findConflicts(
      reservation.fieldId,
      reservation.startTime,
      reservation.endTime,
      reservation._id
    );
    if (conflicts.length > 0) {
      throw new ConflictError('Conflicto de horario con otras reservas', {
        conflicts: conflicts.map((c) => ({
          id: c._id,
          startTime: c.startTime,
          endTime: c.endTime,
          status: c.status,
        })),
      });
    }

    if (reservation.status !== 'PENDING') {
      throw new BadRequestError(
        `No se puede confirmar una reserva con estado: ${reservation.status}`
      );
    }
    if (new Date(reservation.startTime) <= new Date()) {
      throw new BadRequestError(
        'No se puede confirmar una reserva que ya inició o finalizó'
      );
    }

    reservation.status = 'CONFIRMED';
    reservation.confirmation = {
      confirmedAt: new Date(),
      confirmedBy: adminId,
    };
    reservation.lastModifiedBy = adminId;

    return this.enricher.enrichOne(
      await this.reservations.saveWithField(reservation)
    );
  }

  /** El admin cancela una reserva pendiente o confirmada */
  async cancel(id: string, adminId: string) {
    const reservation = await this.reservations.findById(id);
    if (!reservation) throw new NotFoundError('Reserva no encontrada');

    if (!CANCELLABLE_STATUSES.includes(reservation.status)) {
      const message = `No se puede cancelar una reserva con estado: ${reservation.status}`;
      // La versión anterior repetía el mensaje en `error`
      throw new BadRequestError(message, { error: message });
    }

    reservation.status = 'CANCELLED';
    reservation.lastModifiedBy = adminId;

    return this.enricher.enrichOne(
      await this.reservations.saveWithField(reservation)
    );
  }
}
