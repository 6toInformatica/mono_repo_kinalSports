import { cloudinary } from '../../middlewares/file-uploader.js';
import Team from './team.model.js';

// Obtener todos los equipos con paginación y filtros
export const getTeams = async (req, res) => {
  try {
    const { page = 1, limit = 10, isActive, category } = req.query;

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

    // Primera Consulta
    const teams = await Team.find(filter)
      .limit(limitNumber)
      .skip((pageNumber - 1) * limitNumber)
      .sort({ createdAt: -1 });

    // Segunda consulta
    const totalTeams = await Team.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: teams,
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(totalTeams / limitNumber),
        totalRecords: totalTeams,
        limit: limitNumber,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener los equipos',
      error: error.message,
    });
  }
};

// Obtener equipo por ID
export const getTeamById = async (req, res) => {
  try {
    const { id } = req.params;

    const team = await Team.findById(id);

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
    return res.status(500).json({
      success: false,
      message: 'Error al obtener el Equipo',
      error: error.message,
    });
  }
};

// Crear nuevo equipo
export const createTeam = async (req, res) => {
  try {
    const teamData = req.body;

    if (req.file) {
      const extension = req.file.path.split('.').pop();
      const fileName = req.file.filename;
      const relativePath = fileName.substring(fileName.indexOf('teams/'));

      teamData.logo = `${relativePath}.${extension}`;
    } else {
      // Si no se envía archivo, usar logo por defecto de fields
      teamData.logo = 'fields/kinal_sports_nyvxo5';
    }

    const team = new Team(teamData);
    await team.save();

    return res.status(201).json({
      success: true,
      message: 'Equipo creado correctamente',
      data: team,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Error al crear el equipo',
      error: error.message,
    });
  }
};

// Actualizar equipo
export const updateTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // No permitir cambiar estado desde esta ruta
    if (Object.prototype.hasOwnProperty.call(updateData, 'isActive')) {
      delete updateData.isActive;
    }

    // No permitir cambiar managerId desde esta ruta
    if (Object.prototype.hasOwnProperty.call(updateData, 'managerId')) {
      delete updateData.managerId;
    }

    // Verificación y procesamiento de la imagen adjunta
    if (req.file) {
      const currentTeam = await Team.findById(id);

      // eliminación de logo anterior de cloudinary
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

      // Actualizando solo el campo logo en req.body
      // para la nueva actualización
      const extension = req.file.path.split('.').pop();
      const fileName = req.file.filename;
      const relativePath = fileName.includes('teams/')
        ? fileName.substring(fileName.indexOf('teams/'))
        : fileName;
      updateData.logo = `${relativePath}.${extension}`;
    }

    // Actualización del dato en la base de datos
    const team = await Team.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Equipo no encontrado',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Equipo actualizado exitosamente',
      data: team,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error al actualizar el equipo',
      error: error.message,
    });
  }
};

// Cambiar manager del equipo (solo admin via ruta dedicada)
export const changeTeamManager = async (req, res) => {
  try {
    const { id } = req.params;
    const { managerId } = req.body;

    const team = await Team.findByIdAndUpdate(
      id,
      { managerId },
      { new: true, runValidators: true }
    );

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Equipo no encontrado',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Manager del equipo actualizado exitosamente',
      data: team,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Error al actualizar el manager del equipo',
      error: error.message,
    });
  }
};

// Cambiar estado del equipo (activar/desactivar)
export const changeTeamStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Detectar si es activate o deactivate desde la URL
    const isActive = req.url.includes('/activate');
    const action = isActive ? 'activado' : 'desactivado';

    const team = await Team.findByIdAndUpdate(id, { isActive }, { new: true });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Equipo no encontrado',
      });
    }

    res.status(200).json({
      success: true,
      message: `Equipo ${action} exitosamente`,
      data: team,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al cambiar el estado del equipo',
      error: error.message,
    });
  }
};
