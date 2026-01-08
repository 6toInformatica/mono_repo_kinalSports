import { Router } from 'express';
import {
  getTournaments,
  getTournamentById,
  createTournament,
  updateTournament,
  changeTournamentStatus,
  deleteTournament,
} from './tournaments.controller.js';
import { cleanupUploadedFileOnFinish } from '../../middlewares/delete-file-on-error.js';

const router = Router();

// Rutas GET
//! Falta verificación <validateGetTournamentById>
//router.get('/:id', validateGetTournamentById, getTournamentById);
router.get('/', getTournaments);
router.get('/:id', getTournamentById);

// Rutas POST - requieren autenticación
router.post('/', cleanupUploadedFileOnFinish, createTournament);

// Rutas PUT - Requiere autenticación
router.put('/:id', cleanupUploadedFileOnFinish, updateTournament);

//! Falta verificación <validateTournamentStatusChange>
router.put('/:id/activate', changeTournamentStatus);
router.put('/:id/deactivate', changeTournamentStatus);

// Rutas DELETE - Requiere autenticación
//! Falta verificación < >
router.delete('/:id', deleteTournament);
export default router;
