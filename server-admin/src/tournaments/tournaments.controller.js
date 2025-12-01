import Tournament from './tournaments.model.js';

// Obtener todos los torneos con paginación y filtro
export const getTournaments = async (req, res) => {
  try {
    const { page = 1, limit = 10, isActive, category } = req.query;

    // Crear un objeto para filtrar la consulta
    const filter = {};

    if (typeof isActive !== 'undefined') {
      filter.isActive = isActive === 'true';
    }

    if (category) {
      filter.category = category;
    }

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);

    // Consulta por página
    const tournaments = await Tournament.find(filter)
      .limit(limitNumber)
      .skip((pageNumber - 1) * limitNumber)
      .sort({ createdAt: -1 });

    // Culsulta la cantidad de documentos que cumplen el filtro
    const totalTournaments = await Tournament.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: tournaments,
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(totalTournaments / limitNumber),
        limit: limitNumber,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al obtener los torneos',
      error: error.message,
    });
  }
};

// Obtener torneo por ID
export const getTournamentById = async (req, res) => {
  try {
    const { id } = req.params;

    // Consulta
    const tournament = await Tournament.findById(id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Torneo no encontrado',
      });
    }

    res.status(200).json({
      success: true,
      data: tournament,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al obtener el torneo',
      error: error.message,
    });
  }
};

// Crear torneo
export const createTournament = async (req, res) => {
  try {
    const tournamentData = req.body;

    // Consulta y creación de nuevo archivo en la base de datos
    const tournament = new Tournament(tournamentData);
    await tournament.save();

    res.status(200).json({
      success: true,
      data: tournament,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al crear el torneo',
      error: error.message,
    });
  }
};

// Actualizar torneo
export const updateTournament = async (req, res) => {
  try {
    const updateTournament = { ...req.body };
    const { id } = req.params;

    const tournament = await Tournament.findByIdAndUpdate(
      id,
      updateTournament,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Torneo no encontrado',
      });
    }

    res.status(200).json({
      success: true,
      data: tournament,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Error al actualizar el torneo',
      error: error.message,
    });
  }
};

// Cambiar estado del torneo (activar/desactivar)
export const changeTournamentStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const isActive = req.url.includes('/activate');
    const action = isActive ? 'activado' : 'desactivado';

    console.log('---------------' + action);

    // Consulta en la base de datos
    const tournament = await Tournament.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    );

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Torneo no encontrado',
      });
    }

    res.status(200).json({
      success: true,
      message: `Torneo ${action} exitosamente`,
      data: tournament,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'error al cambiar el estado del torneo',
      error: error.message,
    });
  }
};

// eliminar torneo
export const deleteTournament = async (req, res) => {
  try {
    const { id } = req.params;

    const tournament = await Tournament.findByIdAndDelete(id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Torneo no encontrado',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Torneo eliminado exitosamente',
      data: tournament,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar el torneo',
      error: error.message,
    });
  }
};
