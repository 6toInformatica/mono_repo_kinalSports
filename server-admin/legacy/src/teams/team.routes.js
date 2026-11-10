import { Router } from 'express';
import {
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  changeTeamStatus,
  changeTeamManager,
  addTeamNamedMember,
  removeTeamNamedMember,
} from './team.controller.js';
import {
  validateCreateTeam,
  validateUpdateTeamRequest,
  validateTeamStatusChange,
  validateGetTeamById,
  authorizeUpdateTeam,
  validateChangeTeamManager,
  validateTeamNamedMemberAdmin,
  validateRemoveNamedMemberAdmin,
} from '../../middlewares/team-validators.js';
import { uploadTeamImage } from '../../middlewares/file-uploader.js';
import { cleanupUploadedFileOnFinish } from '../../middlewares/delete-file-on-error.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { requireRole } from '../../middlewares/validate-role.js';
import { authOrInternal } from '../../middlewares/validate-internal-token.js';

const router = Router();

// Rutas GET - Permiten autenticación mixta para ser consumidos por el microservicio de usuarios
router.get('/', authOrInternal, getTeams);
router.get('/:id', authOrInternal, validateGetTeamById, getTeamById);

// Rutas POST - Crear un equipo oficial (Solo ADMIN)
router.post(
  '/',
  // Autenticar y autorizar antes de subir la imagen a Cloudinary
  validateJWT,
  requireRole('ADMIN_ROLE'),
  uploadTeamImage.single('logo'),
  cleanupUploadedFileOnFinish,
  validateCreateTeam,
  createTeam
);

/**
 * Rutas PUT - Administradores o dueños del equipo según authorizeUpdateTeam
 * Note: authorizeUpdateTeam ya valida internamente el rol, por lo que va al inicio.
 */
router.put(
  '/:id',
  // Autenticar antes de subir la imagen a Cloudinary
  validateJWT,
  uploadTeamImage.single('logo'),
  cleanupUploadedFileOnFinish,
  validateUpdateTeamRequest,
  authorizeUpdateTeam,
  updateTeam
);

// Gestión de estado y manager (Restringido solo a ADMIN)
router.put(
  '/:id/activate',
  validateTeamStatusChange,
  requireRole('ADMIN_ROLE'),
  changeTeamStatus
);

router.put(
  '/:id/deactivate',
  validateTeamStatusChange,
  requireRole('ADMIN_ROLE'),
  changeTeamStatus
);

router.put(
  '/:id/manager',
  validateChangeTeamManager,
  requireRole('ADMIN_ROLE'),
  changeTeamManager
);

router.post(
  '/:id/named-members',
  validateTeamNamedMemberAdmin,
  addTeamNamedMember
);

router.delete(
  '/:id/named-members/:memberId',
  validateRemoveNamedMemberAdmin,
  removeTeamNamedMember
);

export default router;
