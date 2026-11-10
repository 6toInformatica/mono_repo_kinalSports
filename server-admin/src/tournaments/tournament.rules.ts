import type { Request } from 'express';
import { body, param } from '../common/validation/request-rules.js';
import {
  TOURNAMENT_CATEGORIES,
  TOURNAMENT_STATUSES,
} from './schemas/tournament.schema.js';

// Los mensajes de torneos van sin tildes, igual que en la versión anterior
export const TOURNAMENT_ID_MESSAGE =
  'ID debe ser un ObjectId valido de MongoDB';

/** Si llegan ambas fechas, la de finalización no puede ser anterior a la de inicio */
const endDateAfterStartDate = (endDate: unknown, req: Request) => {
  const startDate = (req.body as Record<string, unknown> | undefined)
    ?.startDate;
  if (startDate && new Date(String(endDate)) < new Date(String(startDate))) {
    throw new Error(
      'La fecha de finalizacion no puede ser anterior a la de inicio'
    );
  }
};

const optionalFields = () => [
  body('teams').optional().isArray('Teams debe ser un arreglo'),
  body('teams.*').optional().isMongoId('Cada team debe ser un ObjectId valido'),
  body('status').optional().isIn(TOURNAMENT_STATUSES, 'Estado no valido'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }, 'La descripcion no puede exceder 500 caracteres'),
];

export const createTournamentRules = [
  body('tournamentsName')
    .trim()
    .notEmpty('El nombre del torneo es requerido')
    .isLength(
      { min: 2, max: 100 },
      'El nombre debe tener entre 2 y 100 caracteres'
    ),
  body('category')
    .notEmpty('La categoria del torneo es requerida')
    .isIn(TOURNAMENT_CATEGORIES, 'Categoria no valida'),
  body('startDate')
    .notEmpty('La fecha de inicio es requerida')
    .isISO8601('La fecha de inicio debe ser valida (ISO 8601)'),
  body('endDate')
    .notEmpty('La fecha de finalizacion es requerida')
    .isISO8601('La fecha de finalizacion debe ser valida (ISO 8601)')
    .bail()
    .custom(endDateAfterStartDate),
  ...optionalFields(),
];

export const updateTournamentRules = [
  param('id').isMongoId(TOURNAMENT_ID_MESSAGE),
  body('tournamentsName')
    .optional()
    .trim()
    .isLength(
      { min: 2, max: 100 },
      'El nombre debe tener entre 2 y 100 caracteres'
    ),
  body('category')
    .optional()
    .isIn(TOURNAMENT_CATEGORIES, 'Categoria no valida'),
  body('startDate')
    .optional()
    .isISO8601('La fecha de inicio debe ser valida (ISO 8601)'),
  body('endDate')
    .optional()
    .isISO8601('La fecha de finalizacion debe ser valida (ISO 8601)')
    .bail()
    .custom(endDateAfterStartDate),
  ...optionalFields(),
];
