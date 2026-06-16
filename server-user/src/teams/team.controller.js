'use strict';

import {
  fetchTeams,
  fetchTeamById,
  fetchMyTeams,
  addTeamMember,
  removeTeamMember,
  createTeam as createTeamService,
  addNamedMember,
  removeNamedMember,
  addTeamMemberByUsername,
  removeTeamMemberByCaptain,
} from './team.service.js';
import { uploadBufferToCloudinary } from '../../middlewares/file-uploader.js';
import { parseNamedMembers } from '../../helpers/team-helpers.js';
import { enrichTeamDetails } from '../../helpers/team-enrichment.js';

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
 * Crear un equipo propiamente desde el usuario
 */
export const createTeam = async (req, res) => {
  try {
    const userId = req.user.id;
    const { teamName, category, namedMembers } = req.body;

    if (!teamName || !category) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del equipo y la categoría son requeridos',
      });
    }

    let logo;
    if (req.file) {
      const folder =
        process.env.CLOUDINARY_TEAMS_FOLDER || 'kinal_sports/teams';
      const result = await uploadBufferToCloudinary(
        req.file.buffer,
        folder,
        req.file.originalname
      );
      logo = result.public_id;
    }

    const data = {
      teamName,
      category,
      managerId: userId,
      members: [userId],
      namedMembers: parseNamedMembers(namedMembers),
      ...(logo && { logo }),
    };

    const newTeam = await createTeamService(data);
    const teamData = await enrichTeamDetails(newTeam);

    return res.status(201).json({
      success: true,
      message: 'Equipo creado exitosamente',
      data: teamData,
    });
  } catch (error) {
    console.error('Error en createTeam controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al crear el equipo',
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

    const teamData = await enrichTeamDetails(team);

    return res.status(200).json({
      success: true,
      data: teamData,
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

    const teamData = await enrichTeamDetails(team);

    return res.status(200).json({
      success: true,
      message: `Te has unido exitosamente al equipo: ${team.teamName}`,
      data: teamData,
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

    const teamData = await enrichTeamDetails(team);

    return res.status(200).json({
      success: true,
      message: `Has salido del equipo ${team.teamName} correctamente`,
      data: teamData,
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

export const addTeamNamedMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del miembro es requerido',
      });
    }

    const team = await addNamedMember(id, name);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Equipo no encontrado',
      });
    }

    const teamData = await enrichTeamDetails(team);

    return res.status(200).json({
      success: true,
      message: 'Miembro agregado al roster',
      data: teamData,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Error al agregar miembro al roster',
    });
  }
};

export const addTeamAppMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { username } = req.body;

    if (!username?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El username del usuario es requerido',
      });
    }

    const team = await addTeamMemberByUsername(id, username);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Equipo no encontrado',
      });
    }

    const teamData = await enrichTeamDetails(team);

    return res.status(200).json({
      success: true,
      message: 'Usuario agregado al equipo',
      data: teamData,
    });
  } catch (error) {
    const isClientError =
      error.message.includes('Ya eres miembro') ||
      error.message.includes('no encontrado');
    return res.status(isClientError ? 400 : 500).json({
      success: false,
      message: error.message || 'Error al agregar usuario al equipo',
    });
  }
};

export const removeTeamAppMember = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const team = await removeTeamMemberByCaptain(id, userId);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Equipo no encontrado',
      });
    }

    const teamData = await enrichTeamDetails(team);

    return res.status(200).json({
      success: true,
      message: 'Usuario eliminado del equipo',
      data: teamData,
    });
  } catch (error) {
    const isClientError =
      error.message.includes('no es miembro') ||
      error.message.includes('No puedes quitar');
    return res.status(isClientError ? 400 : 500).json({
      success: false,
      message: error.message || 'Error al eliminar usuario del equipo',
    });
  }
};

export const removeTeamNamedMember = async (req, res) => {
  try {
    const { id, memberId } = req.params;
    const team = await removeNamedMember(id, memberId);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Equipo no encontrado',
      });
    }

    const teamData = await enrichTeamDetails(team);

    return res.status(200).json({
      success: true,
      message: 'Miembro eliminado del roster',
      data: teamData,
    });
  } catch (error) {
    const isClientError = error.message.includes('no encontrado');
    return res.status(isClientError ? 404 : 400).json({
      success: false,
      message: error.message || 'Error al eliminar miembro del roster',
    });
  }
};
