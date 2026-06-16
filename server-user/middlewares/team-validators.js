'use strict';

import Team from '../src/teams/team.model.js';

export const authorizeTeamCaptain = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
      });
    }

    const team = await Team.findById(req.params.id).select('managerId');
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Equipo no encontrado',
      });
    }

    if (team.managerId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Solo el capitán del equipo puede realizar esta acción',
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al validar permisos del capitán',
      error: error.message,
    });
  }
};
