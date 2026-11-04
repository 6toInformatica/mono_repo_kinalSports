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
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { requireRole } from '../../middlewares/validate-role.js';
import { authOrInternal } from '../../middlewares/validate-internal-token.js';

const router = Router();

// Rutas GET - Consumibles tanto por el frontend como por otros microservicios
router.get('/', authOrInternal, getFields);
router.get('/:id', authOrInternal, validateGetFieldById, getFieldById);

// Rutas POST - Solo para administradores
router.post(
  '/',
  // Autenticar y autorizar antes de subir la imagen a Cloudinary
  validateJWT,
  requireRole('ADMIN_ROLE'),
  uploadFieldImage.single('image'),
  cleanupUploadedFileOnFinish,
  validateCreateField,
  createField
);

// Rutas PUT - Solo para administradores
router.put(
  '/:id',
  // Autenticar y autorizar antes de subir la imagen a Cloudinary
  validateJWT,
  requireRole('ADMIN_ROLE'),
  uploadFieldImage.single('image'),
  cleanupUploadedFileOnFinish,
  validateUpdateFieldRequest,
  updateField
);

router.put(
  '/:id/activate',
  validateFieldStatusChange,
  requireRole('ADMIN_ROLE'),
  changeFieldStatus
);

router.put(
  '/:id/deactivate',
  validateFieldStatusChange,
  requireRole('ADMIN_ROLE'),
  changeFieldStatus
);

export default router;
