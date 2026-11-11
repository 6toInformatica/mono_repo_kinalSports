import { body, param } from '../common/validation/request-rules.js';

const FIELD_TYPES = ['NATURAL', 'SINTETICA', 'CONCRETO'];
const CAPACITIES = ['FUTBOL_5', 'FUTBOL_7', 'FUTBOL_11'];
const ID_MESSAGE = 'ID debe ser un ObjectId válido de MongoDB';

const description = () =>
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }, 'La descripción no puede exceder 500 caracteres');

export const createFieldRules = [
  body('fieldName')
    .trim()
    .notEmpty('El nombre del campo es requerido')
    .isLength(
      { min: 2, max: 100 },
      'El nombre debe tener entre 2 y 100 caracteres'
    ),
  body('fieldType')
    .notEmpty('El tipo de campo es requerido')
    .isIn(FIELD_TYPES, 'Tipo de superficie no válida'),
  body('capacity')
    .notEmpty('La capacidad es requerida')
    .isIn(CAPACITIES, 'Capacidad no válida'),
  body('pricePerHour')
    .notEmpty('El precio por hora es requerido')
    .isFloat({ min: 0 }, 'El precio debe ser mayor o igual a 0'),
  description(),
];

export const updateFieldRules = [
  param('id').isMongoId(ID_MESSAGE),
  body('fieldName')
    .optional()
    .trim()
    .isLength(
      { min: 2, max: 100 },
      'El nombre debe tener entre 2 y 100 caracteres'
    ),
  body('fieldType')
    .optional()
    .isIn(FIELD_TYPES, 'Tipo de superficie no válida'),
  body('capacity').optional().isIn(CAPACITIES, 'Capacidad no válida'),
  body('pricePerHour')
    .optional()
    .isFloat({ min: 0 }, 'El precio por hora debe ser mayor o igual a 0'),
  description(),
];
