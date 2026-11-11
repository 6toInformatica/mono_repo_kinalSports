import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model, QueryFilter, Types } from 'mongoose';
import {
  ACTIVE_RESERVATION_STATUSES,
  RESERVATION_MODEL,
  type Reservation,
  type ReservationDocument,
} from './schemas/reservation.schema.js';

// Datos de la cancha que acompañan a cada reserva
const FIELD_SUMMARY = 'fieldName fieldType pricePerHour';
const FIELD_DETAIL = `${FIELD_SUMMARY} capacity`;

export type ReservationFilter = QueryFilter<Reservation>;

@Injectable()
export class ReservationRepository {
  constructor(
    @InjectModel(RESERVATION_MODEL)
    private readonly reservations: Model<Reservation>
  ) {}

  /** Página de reservas, más recientes primero, con la cancha y el total */
  async findPage(
    filter: ReservationFilter,
    { skip, limit }: { skip: number; limit: number }
  ) {
    const [items, total] = await Promise.all([
      this.reservations
        .find(filter)
        .limit(limit)
        .skip(skip)
        .sort({ startTime: -1 })
        .populate('fieldId', FIELD_SUMMARY),
      this.reservations.countDocuments(filter),
    ]);
    return { items, total };
  }

  findByIdWithField(id: string) {
    return this.reservations.findById(id).populate('fieldId', FIELD_DETAIL);
  }

  findById(id: string) {
    return this.reservations.findById(id);
  }

  /** Reservas activas que se traslapan con el horario, sin contar `excludeId` */
  findConflicts(
    fieldId: Types.ObjectId | string,
    startTime: Date,
    endTime: Date,
    excludeId: Types.ObjectId | null = null
  ) {
    const filter: ReservationFilter = {
      fieldId,
      status: { $in: ACTIVE_RESERVATION_STATUSES },
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
    };
    if (excludeId) filter._id = { $ne: excludeId };
    return this.reservations.find(filter);
  }

  /** Guarda los cambios y devuelve la reserva con los datos de la cancha */
  async saveWithField(reservation: ReservationDocument) {
    await reservation.save();
    await reservation.populate('fieldId', FIELD_SUMMARY);
    return reservation;
  }
}
