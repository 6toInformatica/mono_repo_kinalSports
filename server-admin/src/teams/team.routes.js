import { Router } from 'express';
import {
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  changeTeamStatus,
  changeTeamManager,
} from './team.controller.js';
import {
  validateCreateTeam,
  validateUpdateTeamRequest,
  validateTeamStatusChange,
  validateGetTeamById,
  authorizeUpdateTeam,
  validateChangeTeamManager,
} from '../../middlewares/team-validators.js';
import { uploadTeamImage } from '../../middlewares/file-uploader.js';
import { cleanupUploadedFileOnFinish } from '../../middlewares/delete-file-on-error.js';

const router = Router();

// Rutas GET
router.get('/', getTeams);
router.get('/:id', validateGetTeamById, getTeamById);

// Rutas POST - Requieren autentiación
router.post(
  '/',
  uploadTeamImage.single('logo'),
  cleanupUploadedFileOnFinish,
  validateCreateTeam,
  createTeam
);

// Rutas PUT - Requieren autenticación
router.put(
  '/:id',
  uploadTeamImage.single('logo'),
  cleanupUploadedFileOnFinish,
  validateUpdateTeamRequest,
  authorizeUpdateTeam,
  updateTeam
);

router.put('/:id/activate', validateTeamStatusChange, changeTeamStatus);
router.put('/:id/deactivate', validateTeamStatusChange, changeTeamStatus);

// Cambio de manager (solo admin)
router.put('/:id/manager', validateChangeTeamManager, changeTeamManager);

// Rutas DELETE
// Ruta DELETE eliminada: usar PUT /:id/deactivate (soft delete)

export default router;
