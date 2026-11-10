'use strict';

import { sendError } from '../shared/errors.js';
import { getMyProfile, updateAvatar, updateMyProfile } from './user.service.js';

export const getProfile = async (req, res) => {
  try {
    return res
      .status(200)
      .json({ success: true, data: await getMyProfile(req.user.id) });
  } catch (error) {
    return sendError(res, error, {
      log: 'Error en getMyProfile controller:',
      fallbackBody: (e) => ({
        success: false,
        message: 'Error al obtener tu perfil de usuario',
        error: e.message,
      }),
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const profile = await updateMyProfile(req.user.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: profile,
    });
  } catch (error) {
    return sendError(res, error, {
      log: 'Error en updateMyProfile controller:',
      fallbackBody: (e) => ({
        success: false,
        message: 'Error al actualizar tu perfil',
        error: e.message,
      }),
    });
  }
};

export const uploadAvatar = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No se ha proporcionado ninguna imagen',
    });
  }

  try {
    const profile = await updateAvatar(
      req.user.id,
      req.file,
      req.headers.authorization
    );
    return res.status(200).json({
      success: true,
      message: 'Avatar actualizado exitosamente',
      data: profile,
    });
  } catch (error) {
    // Si el servicio de auth rechazó la foto, se responde con su status y mensaje
    console.error('Error en uploadAvatar controller:', error);
    return res.status(error.status || 500).json({
      success: false,
      message:
        error.response?.data?.message ||
        error.message ||
        'Error al subir el avatar del usuario',
    });
  }
};
