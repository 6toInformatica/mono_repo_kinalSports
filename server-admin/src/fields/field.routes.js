import { Router } from 'express';
import {
  getFields,
  getFieldById,
  createField,
  updateField,
  changeFieldStatus,
} from './field.controller.js';
import {
  validateCreateField,
  validateUpdateFieldRequest,
  validateFieldStatusChange,
  validateGetFieldById,
} from '../../middlewares/field-validators.js';
import { uploadFieldImage } from '../../middlewares/file-uploader.js';
import { cleanupUploadedFileOnFinish } from '../../middlewares/delete-file-on-error.js';
import { requireRole } from '../../middlewares/validate-role.js';
import { authOrInternal } from '../../middlewares/validate-internal-token.js';

const router = Router();

// Rutas GET - Consumibles tanto por el frontend como por otros microservicios
router.get('/', authOrInternal, validateGetFieldById, getFields);
router.get('/:id', authOrInternal, validateGetFieldById, getFieldById);

// Rutas POST - Solo para administradores
router.post(
  '/',
  requireRole('ADMIN_ROLE'), // Validar rol antes de procesar archivos
  uploadFieldImage.single('image'),
  cleanupUploadedFileOnFinish,
  validateCreateField,
  createField
);

// Rutas PUT - Solo para administradores
router.put(
  '/:id',
  requireRole('ADMIN_ROLE'), // Validar rol antes de procesar archivos
  uploadFieldImage.single('image'),
  cleanupUploadedFileOnFinish,
  validateUpdateFieldRequest,
  updateField
);

router.put(
  '/:id/activate',
  requireRole('ADMIN_ROLE'),
  validateFieldStatusChange,
  changeFieldStatus
);

router.put(
  '/:id/deactivate',
  requireRole('ADMIN_ROLE'),
  validateFieldStatusChange,
  changeFieldStatus
);

export default router;
