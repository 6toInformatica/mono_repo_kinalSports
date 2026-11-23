import { Router } from 'express';
import { getFields, getFieldById, queryFields } from './field.controller.js';

const router = Router();

// Rutas GET y QUERY - Públicas para usuarios (QUERY permite enviar filtros en el body)
router.get('/', getFields);
router.query('/', queryFields);
router.get('/:id', getFieldById);

export default router;
