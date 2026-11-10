'use strict';

import Reservation from './reservation.model.js';

export const reservationRepository = {
  /** Reservas activas (pendientes o confirmadas) que se traslapan con el horario */
  findConflicts(fieldId, startTime, endTime, excludeId = null) {
    return Reservation.findConflictingReservations(
      fieldId,
      startTime,
      endTime,
      excludeId
    );
  },

  async create(data) {
    const reservation = new Reservation(data);
    await reservation.save();
    return reservation;
  },

  async deleteById(id) {
    await Reservation.deleteOne({ _id: id });
  },

  findOwnedBy(reservationId, userId) {
    return Reservation.findOne({ _id: reservationId, userId });
  },

  async save(reservation) {
    await reservation.save();
    return reservation;
  },

  /** Historial del usuario con los datos básicos de cada cancha, más recientes primero */
  findHistory(userId) {
    return Reservation.find({ userId })
      .populate(
        'fieldId',
        'fieldName photo pricePerHour fieldType capacity isActive'
      )
      .sort({ startTime: -1 });
  },

  /** Horarios ocupados de la cancha que se traslapan con el rango [start, end) */
  findOccupiedSlots(fieldId, start, end) {
    return Reservation.find({
      fieldId,
      status: { $nin: ['CANCELLED', 'NO_SHOW'] },
      startTime: { $lt: end },
      endTime: { $gt: start },
    }).select('startTime endTime -_id');
  },
};
