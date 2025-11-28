import { Router } from 'express';
import {
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  changeTeamStatus,
  deleteTeam,
} from './team.controller.js';

//! Falta trabajar las validaciones para equipos
//import {
//    validateCreateTeam,
//    validateUpdateTeamRequest,
//    validateTeamStatusChange,
//    validateGetTeamById,
//} from '../../middlewares/Team-validators.js';
import { uploadTeamImage } from '../../middlewares/file-uploader.js';
import { cleanupUploadedFileOnFinish } from '../../middlewares/delete-file-on-error.js';

const router = Router();

// Rutas GET
router.get('/', getTeams);
router.get('/:id', getTeamById);

//! Falta verificación <validateGetTeamById>
//router.get('/:id', validateGetTeamById, getTeamById);

// Rutas POST - Requieren autentiación
router.post(
  '/',
  uploadTeamImage.single('logo'),
  cleanupUploadedFileOnFinish,
  //  validateCreateTeam,
  createTeam
);

// Rutas PUT - Requieren autenticación
router.put(
  '/:id',
  uploadTeamImage.single('logo'),
  cleanupUploadedFileOnFinish,
  //  validateUpdateTeamRequest,
  updateTeam
);

router.put('/:id/activate', changeTeamStatus);
router.put('/:id/deactivate', changeTeamStatus);

//! Falta verificación <validateTeamStatusChange>
//router.put('/:id/activate', validateTeamStatusChange, changeTeamStatus);
//router.put('/:id/deactivate', validateTeamStatusChange, changeTeamStatus);

// Rutas DELETE
//! Falta verificación < >
router.delete('/:id', deleteTeam);

export default router;
