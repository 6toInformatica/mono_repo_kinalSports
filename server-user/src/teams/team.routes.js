import { Router } from 'express';
import {
  getTeams,
  getTeamById,
  joinTeam,
  getMyTeams,
  leaveTeam,
  createTeam,
  addTeamNamedMember,
  removeTeamNamedMember,
  addTeamAppMember,
  removeTeamAppMember,
} from './team.controller.js';
import { uploadTeamImage } from '../../middlewares/file-uploader.js';
import { authorizeTeamCaptain } from '../../middlewares/team-validators.js';

const router = Router();

router.get('/', getTeams);
router.get('/me/mis-equipos', getMyTeams);
router.post('/', uploadTeamImage.single('logo'), createTeam);
router.get('/:id', getTeamById);
router.post('/:id/join', joinTeam);
router.post('/:id/leave', leaveTeam);
router.post('/:id/members', authorizeTeamCaptain, addTeamAppMember);
router.delete(
  '/:id/members/:userId',
  authorizeTeamCaptain,
  removeTeamAppMember
);
router.post('/:id/named-members', authorizeTeamCaptain, addTeamNamedMember);
router.delete(
  '/:id/named-members/:memberId',
  authorizeTeamCaptain,
  removeTeamNamedMember
);

export default router;
