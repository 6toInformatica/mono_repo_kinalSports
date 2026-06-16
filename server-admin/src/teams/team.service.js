import Team from './team.model.js';
import { cloudinary } from '../../middlewares/file-uploader.js';
import {
  parseNamedMembers,
  ensureManagerInMembers,
} from '../../helpers/team-helpers.js';

export const fetchTeams = async ({
  page = 1,
  limit = 10,
  isActive,
  category,
}) => {
  const filter = {};

  if (typeof isActive !== 'undefined') {
    filter.isActive = isActive === 'true';
  } else {
    // Por defecto solo mostrar equipos activos
    filter.isActive = true;
  }

  if (category) {
    filter.category = category;
  }

  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);

  const teams = await Team.find(filter)
    .limit(limitNumber)
    .skip((pageNumber - 1) * limitNumber)
    .sort({ createdAt: -1 });

  const totalTeams = await Team.countDocuments(filter);

  return {
    teams,
    pagination: {
      currentPage: pageNumber,
      totalPages: Math.ceil(totalTeams / limitNumber),
      totalRecords: totalTeams,
      limit: limitNumber,
    },
  };
};

export const fetchTeamById = async (id) => {
  return Team.findById(id);
};

export const createTeamRecord = async ({ teamData, file }) => {
  const data = { ...teamData };

  data.namedMembers = parseNamedMembers(data.namedMembers);

  if (data.managerId) {
    data.members = ensureManagerInMembers(data.managerId, data.members);
  }

  if (file) {
    data.logo = file.path;
  } else {
    data.logo = 'fields/kinal_sports_nyvxo5';
  }

  const team = new Team(data);
  await team.save();
  return team;
};

export const updateTeamRecord = async ({ id, updateData, file }) => {
  const data = { ...updateData };

  if (Object.prototype.hasOwnProperty.call(data, 'isActive')) {
    delete data.isActive;
  }

  if (Object.prototype.hasOwnProperty.call(data, 'managerId')) {
    delete data.managerId;
  }

  if (Object.prototype.hasOwnProperty.call(data, 'namedMembers')) {
    data.namedMembers = parseNamedMembers(data.namedMembers);
  }

  if (file) {
    const currentTeam = await Team.findById(id);

    if (currentTeam && currentTeam.logo) {
      try {
        // Extraer public_id de la URL guardada
        const url = currentTeam.logo; // URL actual en Cloudinary
        const parts = url.split('/');
        const fileNameWithExt = parts[parts.length - 1]; // ej: team123.jpg
        const publicId = `kinal_sports/teams/${fileNameWithExt.split('.')[0]}`; // quitar extensión
        await cloudinary.uploader.destroy(publicId);
      } catch (deleteError) {
        console.error(
          `Error al eliminar imagen anterior de Cloudinary: ${deleteError.message}`
        );
      }
    }

    // Guardar la nueva URL pública
    data.logo = file.path;
  }

  return Team.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
};

export const updateTeamManager = async ({ id, managerId }) => {
  const team = await Team.findById(id);
  if (!team) return null;

  team.managerId = managerId;
  team.members = ensureManagerInMembers(managerId, team.members);
  await team.save();
  return team;
};

export const addNamedMember = async ({ id, name }) => {
  const team = await Team.findById(id);
  if (!team) return null;

  team.namedMembers.push({ name: name.trim() });
  await team.save();
  return team;
};

export const removeNamedMember = async ({ id, memberId }) => {
  const team = await Team.findById(id);
  if (!team) return null;

  const member = team.namedMembers.id(memberId);
  if (!member) {
    throw new Error('Miembro del roster no encontrado');
  }

  member.deleteOne();
  await team.save();
  return team;
};

export const updateTeamStatus = async ({ id, isActive }) => {
  return Team.findByIdAndUpdate(id, { isActive }, { new: true });
};
