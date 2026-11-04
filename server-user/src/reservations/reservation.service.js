'use strict';

import Reservation from './reservation.model.js';
import { getBusinessDayRange } from '../../helpers/validation-helpers.js';

/**
 * Guardar nueva reservación.
 */
export const registerReservation = async (reservationData, userId) => {
  const reservation = new Reservation({
    ...reservationData,
    userId,
    status: 'PENDING',
    lastModifiedBy: userId,
  });

  await reservation.save();

  // Verificación posterior al insert: MongoDB standalone no tiene transacciones, así que
  // dos solicitudes simultáneas pueden pasar el chequeo previo. Si ahora existe otra reserva
  // solapada creada antes (ObjectId menor), esta se descarta y solo sobrevive la primera.
  const conflicts = await Reservation.findConflictingReservations(
    reservation.fieldId,
    reservation.startTime,
    reservation.endTime,
    reservation._id
  );
  const lostRace = conflicts.some(
    (other) => other._id.toString() < reservation._id.toString()
  );

  if (lostRace) {
    await Reservation.deleteOne({ _id: reservation._id });
    const error = new Error('Conflicto de horario con otras reservas');
    error.statusCode = 409;
    throw error;
  }

  return reservation;
};

/**
 * Cancelar una reservación si pertenece al usuario y su estado lo permite.
 */
export const cancelUserReservation = async (reservationId, userId) => {
  const reservation = await Reservation.findOne({
    _id: reservationId,
    userId,
  });

  if (!reservation) return null;

  if (!['PENDING', 'CONFIRMED'].includes(reservation.status)) {
    throw new Error(
      `No se puede cancelar una reserva con estado ${reservation.status}`
    );
  }

  if (reservation.startTime <= new Date()) {
    throw new Error(
      'No se puede cancelar una reserva que ya inició o finalizó'
    );
  }

  reservation.status = 'CANCELLED';
  reservation.lastModifiedBy = userId;
  await reservation.save();

  return reservation;
};

/**
 * Obtener historial de reservaciones del usuario.
 */
export const fetchUserReservationHistory = async (userId) => {
  return await Reservation.find({ userId })
    .populate(
      'fieldId',
      'fieldName photo pricePerHour fieldType capacity isActive'
    )
    .sort({ startTime: -1 });
};

/**
 * Consultar lapsos de tiempo ocupados para un campo en una fecha.
 */
export const fetchOccupiedSlots = async (fieldId, date) => {
  // El día se interpreta en la zona horaria del negocio, no en UTC
  const { start, end } = getBusinessDayRange(date);

  // Incluye reservas que se traslapan con el día (no solo las que inician en él)
  return await Reservation.find({
    fieldId,
    status: { $nin: ['CANCELLED', 'NO_SHOW'] },
    startTime: { $lt: end },
    endTime: { $gt: start },
  }).select('startTime endTime -_id');
};
