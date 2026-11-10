'use strict';

// Rutas de Express de la versión anterior, montadas dentro de NestJS mientras se migran
// a módulos de Nest (fases 4.2 y 4.3). Incluye su propio parseo del cuerpo y su manejador
// de errores para conservar exactamente las mismas respuestas.
import express from 'express';
import { errorHandler } from './middlewares/handle-errors.js';
import fieldRoutes from './src/fields/field.routes.js';
import reservationRoutes from './src/reservations/reservation.routes.js';
import teamRoutes from './src/teams/team.routes.js';
import tournamentRoutes from './src/tournaments/tournaments.routes.js';

export const createLegacyRouter = () => {
  const router = express.Router();

  router.use(express.urlencoded({ extended: false, limit: '10mb' }));
  router.use(express.json({ limit: '10mb' }));

  router.use('/fields', fieldRoutes);
  router.use('/reservations', reservationRoutes);
  router.use('/teams', teamRoutes);
  router.use('/tournaments', tournamentRoutes);

  router.use(errorHandler);
  return router;
};
