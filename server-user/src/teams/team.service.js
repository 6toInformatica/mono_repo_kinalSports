'use strict';

import {
  getUserByUsername,
  getUsersByIds,
} from '../infrastructure/auth.client.js';
import { uploadImage } from '../infrastructure/cloudinary.storage.js';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from '../shared/errors.js';
import { formatUserDisplayName } from '../shared/user-format.js';
import { teamRepository } from './team.repository.js';
import {
  MAX_MEMBERS_BY_CATEGORY,
  ensureManagerInMembers,
  getMaxMembers,
  parseNamedMembers,
} from './team.rules.js';

const TEAM_NOT_FOUND = 'Equipo no encontrado';

const sameId = (a, b) => String(a) === String(b);
const isMember = (team, userId) =>
  team.members.some((memberId) => sameId(memberId, userId));

const findTeamOrFail = async (teamId) => {
  const team = await teamRepository.findById(teamId);
  if (!team) throw new NotFoundError(TEAM_NOT_FOUND);
  return team;
};

/**
 * Agrega el nombre del capitán y el perfil público de cada miembro,
 * consultando el servicio de auth.
 */
export const enrichTeam = async (team) => {
  const teamData = team.toObject ? team.toObject() : { ...team };
  const members = teamData.members ?? [];

  // Una consulta por usuario distinto (el capitán también es miembro)
  const profiles = await getUsersByIds([teamData.managerId, ...members]);

  const managerProfile = profiles.get(String(teamData.managerId));
  if (managerProfile) {
    teamData.managerName = formatUserDisplayName(managerProfile);
  }

  teamData.memberProfiles = members.map((memberId) => {
    const profile = profiles.get(String(memberId));
    const username = profile?.username ?? profile?.Username ?? null;
    return {
      userId: memberId,
      displayName: formatUserDisplayName(profile) ?? username ?? 'Miembro',
      username,
      isCaptain: sameId(memberId, teamData.managerId),
    };
  });

  return teamData;
};

export const listTeams = () => teamRepository.findActive();

export const listMyTeams = (userId) =>
  teamRepository.findActiveByMember(userId);

export const getTeam = async (teamId) =>
  enrichTeam(await findTeamOrFail(teamId));

/** Lanza NotFoundError o ForbiddenError si el usuario no es el capitán del equipo */
export const assertTeamCaptain = async (teamId, userId) => {
  const team = await teamRepository.findManager(teamId);
  if (!team) throw new NotFoundError(TEAM_NOT_FOUND);
  if (!sameId(team.managerId, userId)) {
    throw new ForbiddenError(
      'Solo el capitán del equipo puede realizar esta acción'
    );
  }
};

/**
 * Crea un equipo con el usuario como capitán y primer miembro.
 * Los datos se validan antes de subir el logo, para no dejar imágenes huérfanas.
 */
export const createTeam = async (
  userId,
  { teamName, category, namedMembers },
  logoFile
) => {
  if (!teamName || !category) {
    throw new BadRequestError(
      'El nombre del equipo y la categoría son requeridos'
    );
  }
  if (!Object.keys(MAX_MEMBERS_BY_CATEGORY).includes(category)) {
    throw new BadRequestError('La categoría debe ser FUTBOL_7 o FUTBOL_11');
  }

  let logo;
  if (logoFile) {
    const folder = process.env.CLOUDINARY_TEAMS_FOLDER || 'kinal_sports/teams';
    const result = await uploadImage(
      logoFile.buffer,
      folder,
      logoFile.originalname
    );
    // URL completa, igual que server-admin, para que ambos clientes la usen directamente
    logo = result.secure_url;
  }

  const team = await teamRepository.create({
    teamName,
    category,
    managerId: userId,
    members: ensureManagerInMembers(userId, [userId]),
    namedMembers: parseNamedMembers(namedMembers),
    ...(logo && { logo }),
  });

  return enrichTeam(team);
};

/** Agrega al usuario como miembro si el equipo está activo y tiene cupo */
const addMember = async (teamId, userId) => {
  const team = await findTeamOrFail(teamId);

  if (!team.isActive) {
    throw new BadRequestError('El equipo no está disponible');
  }
  if (isMember(team, userId)) {
    throw new BadRequestError('Ya eres miembro de este equipo');
  }

  const maxMembers = getMaxMembers(team.category);
  if (team.members.length >= maxMembers) {
    throw new BadRequestError(
      `El equipo alcanzó el cupo máximo de ${maxMembers} miembros`
    );
  }

  team.members.push(String(userId));
  return teamRepository.save(team);
};

export const joinTeam = async (teamId, userId) => {
  const team = await addMember(teamId, userId);
  return { teamName: team.teamName, team: await enrichTeam(team) };
};

/** El capitán no puede abandonar su propio equipo por esta vía */
export const leaveTeam = async (teamId, userId) => {
  const team = await findTeamOrFail(teamId);

  if (!isMember(team, userId)) {
    throw new BadRequestError('No perteneces a este equipo');
  }
  if (sameId(team.managerId, userId)) {
    throw new BadRequestError(
      'Como manager del equipo, no puedes abandonarlo mediante esta vía.'
    );
  }

  team.members = team.members.filter((memberId) => !sameId(memberId, userId));
  await teamRepository.save(team);
  return { teamName: team.teamName, team: await enrichTeam(team) };
};

/** El capitán agrega a otro usuario de la app por su username */
export const addMemberByUsername = async (teamId, username) => {
  const profile = await getUserByUsername(username);
  const userId = profile?.id ?? profile?.Id;
  if (!userId) {
    throw new BadRequestError('Usuario de la app no encontrado');
  }
  return enrichTeam(await addMember(teamId, userId));
};

export const removeMemberByCaptain = async (teamId, memberUserId) => {
  const team = await findTeamOrFail(teamId);

  if (sameId(team.managerId, memberUserId)) {
    throw new BadRequestError('No puedes quitar al capitán del equipo');
  }
  if (!isMember(team, memberUserId)) {
    throw new BadRequestError('El usuario no es miembro del equipo');
  }

  team.members = team.members.filter(
    (memberId) => !sameId(memberId, memberUserId)
  );
  return enrichTeam(await teamRepository.save(team));
};

/** Integrantes sin cuenta en la app (solo nombre) */
export const addNamedMember = async (teamId, name) => {
  const team = await findTeamOrFail(teamId);
  team.namedMembers.push({ name: name.trim() });
  return enrichTeam(await teamRepository.save(team));
};

export const removeNamedMember = async (teamId, memberId) => {
  const team = await findTeamOrFail(teamId);

  const member = team.namedMembers.id(memberId);
  if (!member) throw new NotFoundError('Miembro del roster no encontrado');

  member.deleteOne();
  return enrichTeam(await teamRepository.save(team));
};
