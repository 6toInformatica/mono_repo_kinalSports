'use strict';

import { isAppError } from '../shared/errors.js';
import { assertTeamCaptain } from './team.service.js';

/** Solo el capitán del equipo (:id) puede continuar */
export const authorizeTeamCaptain = async (req, res, next) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Usuario no autenticado',
    });
  }

  try {
    await assertTeamCaptain(req.params.id, userId);
    return next();
  } catch (error) {
    if (isAppError(error)) {
      return res
        .status(error.status)
        .json({ success: false, message: error.message });
    }
    return res.status(500).json({
      success: false,
      message: 'Error al validar permisos del capitán',
      error: error.message,
    });
  }
};
