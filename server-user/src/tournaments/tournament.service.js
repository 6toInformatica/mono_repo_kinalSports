'use strict';

import mongoose from 'mongoose';
import { getAdminTournament } from '../infrastructure/admin.client.js';
import { BadRequestError, NotFoundError } from '../shared/errors.js';
import { teamRepository } from '../teams/team.repository.js';
import { tournamentRepository } from './tournament.repository.js';

export const listTournaments = () => tournamentRepository.findActive();

export const getTournament = async (id) => {
  const tournament = await tournamentRepository.findById(id);
  if (!tournament) throw new NotFoundError('Torneo no encontrado');
  return tournament;
};

/** Torneos activos en los que participa alguno de los equipos del usuario */
export const listMyTournaments = async (userId) =>
  tournamentRepository.findActiveByTeams(
    await teamRepository.findIdsByMember(userId)
  );

/**
 * Torneo según server-admin (fuente de verdad), validando que acepte inscripciones.
 * Los errores de inscripción responden 400, igual que antes.
 */
const getOpenAdminTournament = async (tournamentId) => {
  let response;
  try {
    response = await getAdminTournament(tournamentId);
  } catch (error) {
    if ([400, 404].includes(error.response?.status)) {
      throw new BadRequestError('Torneo no encontrado');
    }
    throw error;
  }

  const tournament = response?.data;
  if (
    !response?.success ||
    !tournament?.isActive ||
    tournament.status !== 'PENDIENTE' ||
    new Date(tournament.startDate) <= new Date()
  ) {
    throw new BadRequestError('El torneo no está disponible para inscripción.');
  }
  return tournament;
};

/**
 * El capitán inscribe a su equipo. El torneo se valida contra server-admin y se
 * guarda una copia local la primera vez.
 */
export const registerTeam = async (tournamentId, teamId, userId) => {
  // Un teamId que no es ObjectId (o un objeto) no debe llegar a la consulta
  if (!mongoose.isValidObjectId(teamId)) {
    throw new BadRequestError('Equipo no encontrado');
  }

  const team = await teamRepository.findById(teamId);
  if (!team) throw new BadRequestError('Equipo no encontrado');

  if (team.managerId.toString() !== userId.toString()) {
    throw new BadRequestError('Solo el capitán del equipo puede inscribirlo.');
  }
  if (!team.isActive) {
    throw new BadRequestError('El equipo no está disponible para inscripción.');
  }

  const external = await getOpenAdminTournament(tournamentId);
  if (external.category !== team.category) {
    throw new BadRequestError(
      'La categoría del equipo no coincide con la del torneo.'
    );
  }

  const tournament =
    (await tournamentRepository.findById(tournamentId)) ??
    (await tournamentRepository.create({
      _id: tournamentId,
      tournamentsName: external.tournamentsName,
      category: external.category,
      startDate: external.startDate,
      endDate: external.endDate,
      status: external.status,
      isActive: external.isActive,
    }));

  if (tournament.teams.some((t) => t.toString() === teamId.toString())) {
    throw new BadRequestError('El equipo ya está inscrito en este torneo.');
  }

  tournament.teams.push(teamId);
  await tournamentRepository.save(tournament);

  return { tournament, teamName: team.teamName };
};
