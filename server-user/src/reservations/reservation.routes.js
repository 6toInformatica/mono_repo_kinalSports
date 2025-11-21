import { Router } from 'express';
import {
  createReservation,
  cancelReservation,
} from './reservation.controller.js';
import {
  validateCreateReservation,
  validateCancelReservation,
} from '../../middlewares/reservation-validators.js';
import { checkReservationConflict } from '../../middlewares/reservation-conflict.js';

const router = Router();

// Rutas alineadas al estándar de server-admin (solo creación y cancelación para user)
router.post(
  '/',
  validateCreateReservation,
  checkReservationConflict,
  createReservation
);
router.put('/:id/cancel', validateCancelReservation, cancelReservation);

export default router;
