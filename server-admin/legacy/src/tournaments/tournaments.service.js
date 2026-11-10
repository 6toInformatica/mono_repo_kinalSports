import Tournament from './tournaments.model.js';
import { cloudinary } from '../../middlewares/file-uploader.js';

const DEFAULT_LOGO = 'fields/kinal_sports_nyvxo5';
const TOURNAMENT_LOGO_FOLDER =
  process.env.CLOUDINARY_TOURNAMENTS_FOLDER || 'kinal_sports/tournaments';

export const fetchTournaments = async ({
  page = 1,
  limit = 10,
  isActive,
  category,
}) => {
  const filter = {};

  if (typeof isActive !== 'undefined') {
    filter.isActive = isActive === 'true';
  } else {
    filter.isActive = true;
  }

  if (category) {
    filter.category = category;
  }

  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);

  const tournaments = await Tournament.find(filter)
    .limit(limitNumber)
    .skip((pageNumber - 1) * limitNumber)
    .sort({ createdAt: -1 });

  const totalTournaments = await Tournament.countDocuments(filter);

  return {
    tournaments,
    pagination: {
      currentPage: pageNumber,
      totalPages: Math.ceil(totalTournaments / limitNumber),
      totalRecords: totalTournaments,
      limit: limitNumber,
    },
  };
};

export const fetchTournamentById = async (id) => {
  return Tournament.findById(id);
};

export const createTournamentRecord = async ({ tournamentData, file }) => {
  const data = { ...tournamentData };

  data.logo = file?.path ?? DEFAULT_LOGO;

  const tournament = new Tournament(data);
  await tournament.save();
  return tournament;
};

export const updateTournamentRecord = async ({ id, updateData, file }) => {
  const data = { ...updateData };

  if (file) {
    const currentTournament = await Tournament.findById(id);

    if (currentTournament?.logo && currentTournament.logo !== DEFAULT_LOGO) {
      try {
        const url = currentTournament.logo;
        const parts = url.split('/');
        const fileNameWithExt = parts[parts.length - 1];
        const publicId = `${TOURNAMENT_LOGO_FOLDER}/${fileNameWithExt.split('.')[0]}`;
        await cloudinary.uploader.destroy(publicId);
      } catch (deleteError) {
        console.error(
          `Error al eliminar logo anterior de Cloudinary: ${deleteError.message}`
        );
      }
    }

    data.logo = file.path;
  }

  return Tournament.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
};

export const updateTournamentStatus = async ({ id, isActive }) => {
  return Tournament.findByIdAndUpdate(id, { isActive }, { new: true });
};

export const deleteTournamentRecord = async (id) => {
  return Tournament.findByIdAndDelete(id);
};
