import Team from './team.model.js';
import { cloudinary } from '../../middlewares/file-uploader.js';

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

  if (file) {
    const extension = file.path.split('.').pop();
    const fileName = file.filename;
    const relativePath = fileName.substring(fileName.indexOf('teams/'));

    data.logo = `${relativePath}.${extension}`;
  } else {
    data.logo = 'fields/kinal_sports_nyvxo5';
  }

  const team = new Team(data);
  await team.save();
  return team;
};

export const updateTeamRecord = async ({ id, updateData, file }) => {
  const data = { ...updateData };

  // No permitir cambiar estado desde esta función
  if (Object.prototype.hasOwnProperty.call(data, 'isActive')) {
    delete data.isActive;
  }

  // No permitir cambiar managerId desde esta función
  if (Object.prototype.hasOwnProperty.call(data, 'managerId')) {
    delete data.managerId;
  }

  if (file) {
    const currentTeam = await Team.findById(id);

    if (currentTeam && currentTeam.logo) {
      const logoPath = currentTeam.logo;
      const logoWithOutExt = logoPath.substring(0, logoPath.lastIndexOf('.'));
      const publicId = `kinal_sports/${logoWithOutExt}`;

      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (deleteError) {
        console.error(
          `Error al eliminar imagen anteriores de Cloudinary: ${deleteError.message}`
        );
      }
    }

    const extension = file.path.split('.').pop();
    const fileName = file.filename;
    const relativePath = fileName.includes('teams/')
      ? fileName.substring(fileName.indexOf('teams/'))
      : fileName;
    data.logo = `${relativePath}.${extension}`;
  }

  return Team.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
};

export const updateTeamManager = async ({ id, managerId }) => {
  return Team.findByIdAndUpdate(
    id,
    { managerId },
    { new: true, runValidators: true }
  );
};

export const updateTeamStatus = async ({ id, isActive }) => {
  return Team.findByIdAndUpdate(id, { isActive }, { new: true });
};
