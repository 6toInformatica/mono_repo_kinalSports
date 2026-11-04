import { body, param } from 'express-validator';
import { validateJWT } from './validate-JWT.js';
import { checkValidators } from './handle-errors.js';
import {
  validateEndTimeAfterStartTime,
  validateFutureDate,
  validateMinDuration,
  validateMaxDuration,
  validateBusinessHours,
} from '../helpers/validation-helpers.js';
import Field from '../src/fields/field.model.js';

// Reglas de negocio de reservas
const MIN_DURATION_MINUTES = 60;
const MAX_DURATION_MINUTES = 180;
const OPEN_HOUR = 6;
const CLOSE_HOUR = 22;

// Validaciones para crear reservación (POST /)
export const validateCreateReservation = [
  validateJWT,
  body('fieldId')
    .isMongoId()
    .withMessage('fieldId debe ser un ObjectId válido de MongoDB')
    .bail()
    .custom(async (fieldId) => {
      const field = await Field.findById(fieldId).select('isActive');
      if (!field || !field.isActive) {
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

// Validaciones para cancelar reservación (PUT /:id/cancel)
export const validateCancelReservation = [
  validateJWT,
  param('id')
    .isMongoId()
    .withMessage('ID debe ser un ObjectId válido de MongoDB'),
  checkValidators,
];
