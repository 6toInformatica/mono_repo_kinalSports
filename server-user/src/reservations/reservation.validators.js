import { body, param } from 'express-validator';
import { checkValidators } from '../../middlewares/handle-errors.js';
import { isFieldAvailable } from '../fields/field.service.js';
import {
  CLOSE_HOUR,
  MAX_DURATION_MINUTES,
  MIN_DURATION_MINUTES,
  OPEN_HOUR,
  validateBusinessHours,
  validateEndTimeAfterStartTime,
  validateFutureDate,
  validateMaxDuration,
  validateMinDuration,
} from './reservation.rules.js';

// Crear reservación (POST /): formato, cancha disponible y reglas de horario
export const validateCreateReservation = [
  body('fieldId')
    .isMongoId()
    .withMessage('fieldId debe ser un ObjectId válido de MongoDB')
    .bail()
    .custom(async (fieldId) => {
      if (!(await isFieldAvailable(fieldId))) {
        throw new Error('La cancha no existe o no está disponible');
      }
      return true;
    }),
  body('startTime')
    .isISO8601()
    .withMessage('startTime debe ser una fecha ISO8601 válida')
    .bail()
    .custom(validateFutureDate),
  body('endTime')
    .isISO8601()
    .withMessage('endTime debe ser una fecha ISO8601 válida')
    .bail()
    .custom(validateEndTimeAfterStartTime)
    .bail()
    .custom(validateMinDuration(MIN_DURATION_MINUTES))
    .bail()
    .custom(validateMaxDuration(MAX_DURATION_MINUTES))
    .bail()
    .custom(validateBusinessHours(OPEN_HOUR, CLOSE_HOUR)),
  checkValidators,
];

// Cancelar reservación (PUT /:id/cancel)
export const validateCancelReservation = [
  param('id')
    .isMongoId()
    .withMessage('ID debe ser un ObjectId válido de MongoDB'),
  checkValidators,
];
