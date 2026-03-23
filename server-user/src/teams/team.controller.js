'use strict';

import {
  fetchTeams,
  fetchTeamById,
  fetchMyTeams,
  addTeamMember,
  removeTeamMember,
} from './team.service.js';

/**
 * Listar todos los equipos activos.
 */
export const getTeams = async (req, res) => {
  try {
    const teams = await fetchTeams();
    return res.status(200).json({
      success: true,
      data: teams,
    });
  } catch (error) {
    console.error('Error en getTeams controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener los equipos deportivos',
      error: error.message,
    });
  }
};

/**
 * Ver detalles de un equipo específico.
 */
export const getTeamById = async (req, res) => {
  try {
    const { id } = req.params;
    const team = await fetchTeamById(id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Equipo no encontrado',
      });
    }

    return res.status(200).json({
      success: true,
      data: team,
    });
  } catch (error) {
    console.error('Error en getTeamById controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener el detalle del equipo',
      error: error.message,
    });
  }
};

/**
 * Usuario se une a un equipo.
 */
export const joinTeam = async (req, res) => {
  try {
    const { id: teamId } = req.params;
    const userId = req.user.id;

    const team = await addTeamMember(teamId, userId);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Equipo no encontrado',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Te has unido exitosamente al equipo: ${team.teamName}`,
      data: team,
    });
  } catch (error) {
    const isClientError = error.message.includes('Ya eres miembro');
    return res.status(isClientError ? 400 : 500).json({
      success: false,
      message: error.message || 'Error al intentar unirte al equipo',
    });
  }
};

/**
 * Ver mis equipos (donde soy miembro).
 */
export const getMyTeams = async (req, res) => {
  try {
    const userId = req.user.id;
    const teams = await fetchMyTeams(userId);

    return res.status(200).json({
      success: true,
      data: teams,
    });
  } catch (error) {
    console.error('Error en getMyTeams controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener tus equipos',
      error: error.message,
    });
  }
};

/**
 * Abandonar un equipo.
 */
export const leaveTeam = async (req, res) => {
  try {
    const { id: teamId } = req.params;
    const userId = req.user.id;

    const team = await removeTeamMember(teamId, userId);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Equipo no encontrado',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Has salido del equipo ${team.teamName} correctamente`,
      data: team,
    });
  } catch (error) {
    const isClientError =
      error.message.includes('No perteneces') ||
      error.message.includes('Como manager');
    return res.status(isClientError ? 400 : 500).json({
      success: false,
      message: error.message || 'Error al procesar el abandono del equipo',
    });
  }
};
