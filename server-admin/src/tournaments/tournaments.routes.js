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

const router = Router();

// Rutas GET
router.get('/', getTournaments);
router.get('/:id', validateGetTournamentById, getTournamentById);

// Rutas POST - requieren autenticación
router.post('/', validateCreateTournament, createTournament);

// Rutas PUT - Requiere autenticación
router.put('/:id', validateUpdateTournamentRequest, updateTournament);

router.put(
  '/:id/activate',
  validateTournamentStatusChange,
  changeTournamentStatus
);
router.put(
  '/:id/deactivate',
  validateTournamentStatusChange,
  changeTournamentStatus
);

// Rutas DELETE - Requiere autenticación
router.delete('/:id', validateDeleteTournament, deleteTournament);
export default router;
