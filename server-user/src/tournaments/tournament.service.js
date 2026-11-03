'use strict';

import mongoose from 'mongoose';
import Tournament from './tournament.model.js';
import Team from '../teams/team.model.js';
import adminClient from '../../utils/adminClient.js';

/**
 * Listar todos los torneos activos.
 */
export const fetchTournaments = async () => {
  return await Tournament.find({ isActive: true });
};

/**
 * Detalle de un torneo por ID.
 */
export const fetchTournamentById = async (id) => {
  return await Tournament.findById(id);
};

/**
 * Torneos en los que participa el usuario mediante sus equipos.
 */
export const fetchMyTournaments = async (userId) => {
  const myTeams = await Team.find({ members: userId }).select('_id');
  const myTeamIds = myTeams.map((team) => team._id);

  return await Tournament.find({
    teams: { $in: myTeamIds },
    isActive: true,
  });
};

/**
 * Inscribir equipo en torneo.
 * Valida permisos del capitán y estado del torneo contra admin-service.
 */
export const registerTeam = async (tournamentId, teamId, userId) => {
  // Un teamId que no es ObjectId (o un objeto) no debe llegar a la consulta
  if (!mongoose.isValidObjectId(teamId)) {
    throw new Error('Equipo no encontrado');
  }

  const team = await Team.findById(teamId);
  if (!team) throw new Error('Equipo no encontrado');

  if (team.managerId.toString() !== userId.toString()) {
    throw new Error('Solo el capitán del equipo puede inscribirlo.');
  }

  if (!team.isActive) {
    throw new Error('El equipo no está disponible para inscripción.');
  }

  // 1. Validar torneo con el servicio administrativo
  let adminResponse;
  try {
    adminResponse = await adminClient.get(`/tournaments/${tournamentId}`);
  } catch (error) {
    if ([400, 404].includes(error.response?.status)) {
      throw new Error('Torneo no encontrado');
    }
    throw error;
  }

  const externalData = adminResponse.data?.data;
  if (
    !adminResponse.data?.success ||
    !externalData?.isActive ||
    externalData.status !== 'PENDIENTE' ||
    new Date(externalData.startDate) <= new Date()
  ) {
    throw new Error('El torneo no está disponible para inscripción.');
  }

  if (externalData.category !== team.category) {
    throw new Error('La categoría del equipo no coincide con la del torneo.');
  }

  // 2. Sincronizar (Caché local) si no existe
  let localTournament = await Tournament.findById(tournamentId);

  if (!localTournament) {
    localTournament = new Tournament({
      _id: tournamentId,
      tournamentsName: externalData.tournamentsName,
      category: externalData.category,
      startDate: externalData.startDate,
      endDate: externalData.endDate,
      status: externalData.status,
      isActive: externalData.isActive,
    });
    await localTournament.save();
  }

  // 3. Validar duplicados e inscribir
  if (localTournament.teams.some((t) => t.toString() === teamId.toString())) {
    throw new Error('El equipo ya está inscrito en este torneo.');
  }

  localTournament.teams.push(teamId);

  await localTournament.save();

  return { localTournament, teamName: team.teamName };
};
