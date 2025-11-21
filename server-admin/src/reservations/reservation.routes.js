import { Router } from 'express';
import {
  getReservations,
  getReservationById,
  confirmReservation,
} from './reservation.controller.js';
import {
  validateGetReservations,
  validateGetReservationById,
  validateConfirmReservationRequest,
} from '../../middlewares/reservation-validators.js';
import { checkReservationConflict } from '../../middlewares/reservation-conflict.js';

const router = Router();

// Rutas GET
router.get('/', validateGetReservations, getReservations);
router.get('/:id', validateGetReservationById, getReservationById);

router.put(
  '/:id/confirm',
  validateConfirmReservationRequest,
  checkReservationConflict,
  confirmReservation
);

export default router;
