'use strict';

import { sendError } from '../shared/errors.js';
import * as teams from './team.service.js';

/** Errores inesperados de las acciones de equipo: el mensaje original, con status propio */
const actionError = (fallbackMessage, fallbackStatus = 500) => ({
  fallbackStatus,
  fallbackBody: (e) => ({
    success: false,
    message: e.message || fallbackMessage,
  }),
});

/** Errores inesperados de las consultas: mensaje fijo y detalle en `error` */
const queryError = (log, message) => ({
  log,
  fallbackBody: (e) => ({ success: false, message, error: e.message }),
});

export const getTeams = async (req, res) => {
  try {
    return res
      .status(200)
      .json({ success: true, data: await teams.listTeams() });
  } catch (error) {
    return sendError(
      res,
      error,
      queryError(
        'Error en getTeams controller:',
        'Error al obtener los equipos deportivos'
      )
    );
  }
};

export const createTeam = async (req, res) => {
  try {
    const team = await teams.createTeam(req.user.id, req.body, req.file);
    return res.status(201).json({
      success: true,
      message: 'Equipo creado exitosamente',
      data: team,
    });
  } catch (error) {
    return sendError(
      res,
      error,
      queryError('Error en createTeam controller:', 'Error al crear el equipo')
    );
  }
};

export const getTeamById = async (req, res) => {
  try {
    return res
      .status(200)
      .json({ success: true, data: await teams.getTeam(req.params.id) });
  } catch (error) {
    return sendError(
      res,
      error,
      queryError(
        'Error en getTeamById controller:',
        'Error al obtener el detalle del equipo'
      )
    );
  }
};

export const getMyTeams = async (req, res) => {
  try {
    return res
      .status(200)
      .json({ success: true, data: await teams.listMyTeams(req.user.id) });
  } catch (error) {
    return sendError(
      res,
      error,
      queryError(
        'Error en getMyTeams controller:',
        'Error al obtener tus equipos'
      )
    );
  }
};

export const joinTeam = async (req, res) => {
  try {
    const { teamName, team } = await teams.joinTeam(req.params.id, req.user.id);
    return res.status(200).json({
      success: true,
      message: `Te has unido exitosamente al equipo: ${teamName}`,
      data: team,
    });
  } catch (error) {
    return sendError(
      res,
      error,
      actionError('Error al intentar unirte al equipo')
    );
  }
};

export const leaveTeam = async (req, res) => {
  try {
    const { teamName, team } = await teams.leaveTeam(
      req.params.id,
      req.user.id
    );
    return res.status(200).json({
      success: true,
      message: `Has salido del equipo ${teamName} correctamente`,
      data: team,
    });
  } catch (error) {
    return sendError(
      res,
      error,
      actionError('Error al procesar el abandono del equipo')
    );
  }
};

export const addTeamNamedMember = async (req, res) => {
  const { name } = req.body ?? {};
  if (!name?.trim()) {
    return res.status(400).json({
      success: false,
      message: 'El nombre del miembro es requerido',
    });
  }

  try {
    const team = await teams.addNamedMember(req.params.id, name);
    return res.status(200).json({
      success: true,
      message: 'Miembro agregado al roster',
      data: team,
    });
  } catch (error) {
    return sendError(
      res,
      error,
      actionError('Error al agregar miembro al roster', 400)
    );
  }
};

export const addTeamAppMember = async (req, res) => {
  const { username } = req.body ?? {};
  if (!username?.trim()) {
    return res.status(400).json({
      success: false,
      message: 'El username del usuario es requerido',
    });
  }

  try {
    const team = await teams.addMemberByUsername(req.params.id, username);
    return res.status(200).json({
      success: true,
      message: 'Usuario agregado al equipo',
      data: team,
    });
  } catch (error) {
    return sendError(
      res,
      error,
      actionError('Error al agregar usuario al equipo')
    );
  }
};

export const removeTeamAppMember = async (req, res) => {
  try {
    const team = await teams.removeMemberByCaptain(
      req.params.id,
      req.params.userId
    );
    return res.status(200).json({
      success: true,
      message: 'Usuario eliminado del equipo',
      data: team,
    });
  } catch (error) {
    return sendError(
      res,
      error,
      actionError('Error al eliminar usuario del equipo')
    );
  }
};

export const removeTeamNamedMember = async (req, res) => {
  try {
    const team = await teams.removeNamedMember(
      req.params.id,
      req.params.memberId
    );
    return res.status(200).json({
      success: true,
      message: 'Miembro eliminado del roster',
      data: team,
    });
  } catch (error) {
    return sendError(
      res,
      error,
      actionError('Error al eliminar miembro del roster', 400)
    );
  }
};
