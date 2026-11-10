import { Router } from 'express';
import {
  createReservation,
  cancelReservation,
  getUserHistory,
  checkAvailability,
} from './reservation.controller.js';
import {
  validateCreateReservation,
  validateCancelReservation,
} from './reservation.validators.js';
import { reservationLimit } from '../../middlewares/rate-limit-user.js';

const router = Router();

// Ver disponibilidad de un campo en fecha específica
router.get('/availability', checkAvailability);

// Ver historial de reservaciones del usuario autenticado
router.get('/me/history', getUserHistory);
// Compatibilidad con clientes que aún llaman el endpoint anterior
router.get('/my-reservations', getUserHistory);

// Crear reservación (POST /)
router.post(
  '/',
  reservationLimit,
  validateCreateReservation,
  createReservation
);

// Cancelar reservación (PUT /:id/cancel)
router.put(
  '/:id/cancel',
  reservationLimit,
  validateCancelReservation,
  cancelReservation
);

export default router;
