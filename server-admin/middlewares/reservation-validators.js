'use strict';

import { param } from 'express-validator';
import { validateJWT } from './validate-JWT.js';
import { requireRole } from './validate-role.js';
import { checkValidators } from './check-validators.js';

// GET / - Solo admin
export const validateGetReservations = [
  validateJWT,
  requireRole('ADMIN_ROLE'),
  checkValidators,
];

// GET /pending - Solo admin
export const validateGetPendingReservations = [
  validateJWT,
  requireRole('ADMIN_ROLE'),
  checkValidators,
];

// GET /:id - JWT + ownership check en controller
export const validateGetReservationById = [
  validateJWT,
  param('id')
    .isMongoId()
    .withMessage('ID debe ser un ObjectId válido de MongoDB'),
  checkValidators,
];

// PUT /:id/confirm
export const validateConfirmReservationRequest = [
  validateJWT,
  param('id')
    .isMongoId()
    .withMessage('ID debe ser un ObjectId válido de MongoDB'),
  checkValidators,
];

// PUT /:id/status
// (Status and Notes validators removed due to minimal API)
