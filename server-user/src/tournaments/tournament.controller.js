'use strict';

import { sendError } from '../shared/errors.js';
import * as tournaments from './tournament.service.js';

const queryError = (log, message) => ({
  log,
  fallbackBody: (e) => ({ success: false, message, error: e.message }),
});

export const getTournaments = async (req, res) => {
  try {
    return res
      .status(200)
      .json({ success: true, data: await tournaments.listTournaments() });
  } catch (error) {
    return sendError(
      res,
      error,
      queryError(
        'Error en getTournaments controller:',
        'Error al obtener los torneos deportivos'
      )
    );
  }
};

export const getTournamentById = async (req, res) => {
  try {
    const tournament = await tournaments.getTournament(req.params.id);
    return res.status(200).json({ success: true, data: tournament });
  } catch (error) {
    return sendError(
      res,
      error,
      queryError(
        'Error en getTournamentById controller:',
        'Error al obtener el detalle del torneo'
      )
    );
  }
};

export const registerTeamToTournament = async (req, res) => {
  try {
    const { tournament, teamName } = await tournaments.registerTeam(
      req.params.id,
      req.body.teamId,
      req.user.id
    );
    return res.status(200).json({
      success: true,
      message: `Enhorabuena, el equipo ${teamName} ha sido inscrito exitosamente.`,
      data: tournament,
    });
  } catch (error) {
    return sendError(res, error, {
      fallbackBody: (e) => ({
        success: false,
        message: e.message || 'Error al intentar inscribir al equipo',
      }),
    });
  }
};

export const getMyTournaments = async (req, res) => {
  try {
    const data = await tournaments.listMyTournaments(req.user.id);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return sendError(
      res,
      error,
      queryError(
        'Error en getMyTournaments controller:',
        'Error al obtener tus torneos participados'
      )
    );
  }
};
