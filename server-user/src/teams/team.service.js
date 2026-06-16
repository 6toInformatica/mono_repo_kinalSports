'use strict';

import Team from './team.model.js';
import {
  parseNamedMembers,
  ensureManagerInMembers,
} from '../../helpers/team-helpers.js';
import { getUserByUsername } from '../auth/auth.service.js';

/**
 * Listar todos los equipos deportivos activos.
 */
export const fetchTeams = async () => {
  return await Team.find({ isActive: true });
};

/**
 * Crear un nuevo equipo.
 */
export const createTeam = async (data) => {
  const teamData = { ...data };
  teamData.namedMembers = parseNamedMembers(teamData.namedMembers);

  if (teamData.managerId) {
    teamData.members = ensureManagerInMembers(
      teamData.managerId,
      teamData.members
    );
  }

  const newTeam = new Team(teamData);
  await newTeam.save();
  return newTeam;
};

/**
 * Obtener detalle de un equipo por ID.
 */
export const fetchTeamById = async (id) => {
  return await Team.findById(id);
};

/**
 * Listar equipos donde el usuario es miembro.
 */
export const fetchMyTeams = async (userId) => {
  return await Team.find({
    isActive: true,
    $or: [{ members: userId }, { managerId: userId }],
  });
};

/**
 * Agregar un miembro a un equipo si no existe previamente.
 */
export const addTeamMember = async (teamId, userId) => {
  const team = await Team.findById(teamId);
  if (!team) return null;

  if (team.members.some((memberId) => String(memberId) === String(userId))) {
    throw new Error('Ya eres miembro de este equipo');
  }

  team.members.push(String(userId));
  await team.save();
  return team;
};

/**
 * Remover a un usuario de un equipo, si es miembro y no es el manager.
 */
export const removeTeamMember = async (teamId, userId) => {
  const team = await Team.findById(teamId);
  if (!team) return null;

  if (!team.members.some((memberId) => String(memberId) === String(userId))) {
    throw new Error('No perteneces a este equipo');
  }

  if (String(team.managerId) === String(userId)) {
    throw new Error(
      'Como manager del equipo, no puedes abandonarlo mediante esta vía.'
    );
  }

  team.members = team.members.filter((m) => m.toString() !== userId.toString());
  await team.save();
  return team;
};

export const addNamedMember = async (teamId, name) => {
  const team = await Team.findById(teamId);
  if (!team) return null;

  team.namedMembers.push({ name: name.trim() });
  await team.save();
  return team;
};

export const addTeamMemberByUsername = async (teamId, username) => {
  const profile = await getUserByUsername(username);
  if (!profile) {
    throw new Error('Usuario de la app no encontrado');
  }

  const userId = profile.id ?? profile.Id;
  if (!userId) {
    throw new Error('Usuario de la app no encontrado');
  }

  return addTeamMember(teamId, userId);
};

export const removeTeamMemberByCaptain = async (teamId, memberUserId) => {
  const team = await Team.findById(teamId);
  if (!team) return null;

  if (String(team.managerId) === String(memberUserId)) {
    throw new Error('No puedes quitar al capitán del equipo');
  }

  if (
    !team.members.some((memberId) => String(memberId) === String(memberUserId))
  ) {
    throw new Error('El usuario no es miembro del equipo');
  }

  team.members = team.members.filter(
    (memberId) => String(memberId) !== String(memberUserId)
  );
  await team.save();
  return team;
};

export const removeNamedMember = async (teamId, memberId) => {
  const team = await Team.findById(teamId);
  if (!team) return null;

  const member = team.namedMembers.id(memberId);
  if (!member) {
    throw new Error('Miembro del roster no encontrado');
  }

  member.deleteOne();
  await team.save();
  return team;
};
