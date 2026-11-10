'use strict';

import { sendError } from '../shared/errors.js';
import * as reservations from './reservation.service.js';

export const createReservation = async (req, res) => {
  try {
    const { fieldId, startTime, endTime } = req.body;
    const reservation = await reservations.createReservation(req.user.id, {
      fieldId,
      startTime,
      endTime,
    });
    return res.status(201).json({
      success: true,
      message: 'Reserva creada correctamente',
      data: reservation,
    });
  } catch (error) {
    return sendError(res, error, {
      log: 'Error en createReservation controller:',
      fallbackBody: (e) => ({
        success: false,
        message: 'Error al crear la reservación',
        error: e.message,
      }),
    });
  }
};

export const cancelReservation = async (req, res) => {
  try {
    const reservation = await reservations.cancelReservation(
      req.params.id,
      req.user.id
    );
    return res.status(200).json({
      success: true,
      message: 'Reserva cancelada correctamente',
      data: reservation,
    });
  } catch (error) {
    return sendError(res, error, {
      fallbackBody: (e) => ({
        success: false,
        message: e.message || 'Error interno al cancelar la reservación',
      }),
    });
  }
};

export const getUserHistory = async (req, res) => {
  try {
    const history = await reservations.getReservationHistory(req.user.id);
    return res.status(200).json({ success: true, data: history });
  } catch (error) {
    return sendError(res, error, {
      log: 'Error en getUserHistory controller:',
      fallbackBody: (e) => ({
        success: false,
        message:
          'Error al procesar la obtención del historial de reservaciones',
        error: e.message,
      }),
    });
  }
};

export const checkAvailability = async (req, res) => {
  const { fieldId, date } = req.query;
  if (!fieldId || !date) {
    return res.status(400).json({
      success: false,
      message: 'Debe proporcionar fieldId y date (en formato YYYY-MM-DD)',
    });
  }

  try {
    const slots = await reservations.getOccupiedSlots(fieldId, date);
    return res.status(200).json({ success: true, data: slots });
  } catch (error) {
    return sendError(res, error, {
      log: 'Error en checkAvailability controller:',
      fallbackBody: (e) => ({
        success: false,
        message:
          'Error interno al consultar disponibilidad del campo deportivo',
        error: e.message,
      }),
    });
  }
};
