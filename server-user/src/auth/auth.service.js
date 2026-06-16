'use strict';

import authClient from '../../utils/authClient.js';

/**
 * Obtiene el perfil de un usuario desde auth-node.
 * @param {string} userId
 * @returns {Promise<object|null>}
 */
export const getUserById = async (userId) => {
  try {
    const { data } = await authClient.post('/auth/profile/by-id', { userId });
    return data?.data ?? null;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    console.error(
      'Error al consultar usuario en auth-node:',
      error.response?.data?.message ?? error.message
    );
    return null;
  }
};

/**
 * Busca un usuario de la app por username en auth-node.
 * @param {string} username
 * @returns {Promise<object|null>}
 */
export const getUserByUsername = async (username) => {
  try {
    const { data } = await authClient.post('/auth/profile/by-username', {
      username: username.trim(),
    });
    return data?.data ?? null;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    console.error(
      'Error al buscar usuario por username en auth-node:',
      error.response?.data?.message ?? error.message
    );
    return null;
  }
};
