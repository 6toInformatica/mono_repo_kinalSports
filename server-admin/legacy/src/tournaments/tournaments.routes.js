import { Router } from 'express';
import {
  getTournaments,
  getTournamentById,
  createTournament,
  updateTournament,
  changeTournamentStatus,
  deleteTournament,
} from './tournaments.controller.js';
import {
  validateCreateTournament,
  validateUpdateTournamentRequest,
  validateTournamentStatusChange,
  validateGetTournamentById,
  validateDeleteTournament,
} from '../../middlewares/tournament-validators.js';
import { uploadTournamentImage } from '../../middlewares/file-uploader.js';
import { cleanupUploadedFileOnFinish } from '../../middlewares/delete-file-on-error.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { requireRole } from '../../middlewares/validate-role.js';
import { authOrInternal } from '../../middlewares/validate-internal-token.js';

const router = Router();

// Rutas GET - Públicas o consumidas por server-user vía x-internal-token
router.get('/', authOrInternal, getTournaments);
router.get(
  '/:id',
  authOrInternal,
  validateGetTournamentById,
  getTournamentById
);

// Rutas de escritura - SOLO para administradores globales
router.post(
  '/',
  // Autenticar y autorizar antes de subir la imagen a Cloudinary
  validateJWT,
  requireRole('ADMIN_ROLE'),
  uploadTournamentImage.single('logo'),
  cleanupUploadedFileOnFinish,
  validateCreateTournament,
  createTournament
);

router.put(
  '/:id',
  // Autenticar y autorizar antes de subir la imagen a Cloudinary
  validateJWT,
  requireRole('ADMIN_ROLE'),
  uploadTournamentImage.single('logo'),
  cleanupUploadedFileOnFinish,
  validateUpdateTournamentRequest,
  updateTournament
);

router.put(
  '/:id/activate',
  validateTournamentStatusChange,
  requireRole('ADMIN_ROLE'),
  changeTournamentStatus
);

router.put(
  '/:id/deactivate',
  validateTournamentStatusChange,
  requireRole('ADMIN_ROLE'),
  changeTournamentStatus
);

router.delete(
  '/:id',
  validateDeleteTournament,
  requireRole('ADMIN_ROLE'),
  deleteTournament
);

export default router;
