import { Router } from 'express';
import {
  getTeams,
  getTeamById,
  joinTeam,
  getMyTeams,
  leaveTeam,
} from './team.controller.js';

const router = Router();

// Listar equipos
router.get('/', getTeams);
// Ver detalles de un equipo
router.get('/:id', getTeamById);
// Solicitar unirse a un equipo
router.post('/:id/join', joinTeam);
// Ver mis equipos
router.get('/me/mis-equipos', getMyTeams);
// Salir de un equipo
router.post('/:id/leave', leaveTeam);

export default router;
