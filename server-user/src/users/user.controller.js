'use strict';

import { findOrCreateProfile, updateProfile } from './user.service.js';
import { enrichUserProfile } from '../../helpers/profile-enrichment.js';
import { uploadProfilePictureToAuth } from '../auth/auth-profile.service.js';

/**
 * Obtener perfil del usuario autenticado.
 */
export const getMyProfile = async (req, res) => {
  try {
    const authId = req.user.id;
    const profile = await findOrCreateProfile(authId);
    const enrichedProfile = await enrichUserProfile(profile);

    return res.status(200).json({
      success: true,
      data: enrichedProfile,
    });
  } catch (error) {
    console.error('Error en getMyProfile controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener tu perfil de usuario',
      error: error.message,
    });
  }
};

/**
 * Actualizar perfil del propio usuario.
 */
export const updateMyProfile = async (req, res) => {
  try {
    const authId = req.user.id;
    const { displayName, phone, favoriteSports } = req.body;

    const updatedProfile = await updateProfile(authId, {
      displayName,
      phone,
      favoriteSports,
    });

    const enrichedProfile = await enrichUserProfile(updatedProfile);

    return res.status(200).json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: enrichedProfile,
    });
  } catch (error) {
    console.error('Error en updateMyProfile controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar tu perfil',
      error: error.message,
    });
  }
};

/**
 * Subir o actualizar foto de perfil en auth-service/auth-node.
 */
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se ha proporcionado ninguna imagen',
      });
    }

    const authorization = req.headers.authorization;
    if (!authorization) {
      return res.status(401).json({
        success: false,
        message: 'No se proporcionó un token',
      });
    }

    const authUser = await uploadProfilePictureToAuth(req.file, authorization);

    const profile = await findOrCreateProfile(req.user.id);
    const enrichedProfile = await enrichUserProfile(profile);

    if (authUser?.profilePicture) {
      enrichedProfile.profilePicture = authUser.profilePicture;
      enrichedProfile.avatar = authUser.profilePicture;
    }

    return res.status(200).json({
      success: true,
      message: 'Avatar actualizado exitosamente',
      data: enrichedProfile,
    });
  } catch (error) {
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
