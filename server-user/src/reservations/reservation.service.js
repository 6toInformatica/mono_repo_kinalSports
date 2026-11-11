'use strict';

import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '../shared/errors.js';
import { reservationRepository } from './reservation.repository.js';
import { getBusinessDayRange } from './reservation.rules.js';

const CANCELLABLE_STATUSES = ['PENDING', 'CONFIRMED'];

/**
 * Crea una reserva pendiente si el horario está libre.
 * Las reglas de formato, duración y horario ya las validó la capa HTTP.
 */
export const createReservation = async (
  userId,
  { fieldId, startTime, endTime }
) => {
  const start = new Date(startTime);
  const end = new Date(endTime);

  const conflicts = await reservationRepository.findConflicts(
    fieldId,
    start,
    end
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

  const reservation = await reservationRepository.create({
    fieldId,
    startTime,
    endTime,
    userId,
    status: 'PENDING',
    lastModifiedBy: userId,
  });

  // Verificación posterior al insert: MongoDB standalone no tiene transacciones, así que
  // dos solicitudes simultáneas pueden pasar el chequeo previo. Si ahora existe otra reserva
  // solapada creada antes (ObjectId menor), esta se descarta y solo sobrevive la primera.
  const overlapping = await reservationRepository.findConflicts(
    reservation.fieldId,
    reservation.startTime,
    reservation.endTime,
    reservation._id
  );
  const lostRace = overlapping.some(
    (other) => other._id.toString() < reservation._id.toString()
  );
  if (lostRace) {
    await reservationRepository.deleteById(reservation._id);
    throw new ConflictError('Conflicto de horario con otras reservas');
  }

  return reservation;
};

/** El usuario cancela su propia reserva, si aún no inicia y su estado lo permite */
export const cancelReservation = async (reservationId, userId) => {
  const reservation = await reservationRepository.findOwnedBy(
    reservationId,
    userId
  );
  if (!reservation) {
    throw new NotFoundError(
      'Reserva no encontrada o no pertenece al usuario autenticado'
    );
  }

  if (!CANCELLABLE_STATUSES.includes(reservation.status)) {
    throw new BadRequestError(
      `No se puede cancelar una reserva con estado ${reservation.status}`
    );
  }
  if (reservation.startTime <= new Date()) {
    throw new BadRequestError(
      'No se puede cancelar una reserva que ya inició o finalizó'
    );
  }

  reservation.status = 'CANCELLED';
  reservation.lastModifiedBy = userId;
  return reservationRepository.save(reservation);
};

export const getReservationHistory = (userId) =>
  reservationRepository.findHistory(userId);

/** Horarios ocupados de la cancha en un día (interpretado en la zona horaria del negocio) */
export const getOccupiedSlots = (fieldId, date) => {
  const { start, end } = getBusinessDayRange(date);
  return reservationRepository.findOccupiedSlots(fieldId, start, end);
};
