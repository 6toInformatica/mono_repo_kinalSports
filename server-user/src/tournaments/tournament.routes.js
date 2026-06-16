import { Router } from 'express';
import {
  getTournaments,
  getTournamentById,
  registerTeamToTournament,
  getMyTournaments,
} from './tournament.controller.js';

const router = Router();

// Listar torneos
router.get('/', getTournaments);
// Ver mis torneos (debe ir antes de /:id)
router.get('/me/mis-torneos', getMyTournaments);
// Ver detalles de un torneo
router.get('/:id', getTournamentById);
// Inscribir equipo en torneo
router.post('/:id/register', registerTeamToTournament);

export default router;
