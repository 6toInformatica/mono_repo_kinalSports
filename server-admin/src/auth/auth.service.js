'use strict';

import authClient from '../../utils/authClient.js';

/**
 * Obtiene el perfil de un usuario desde auth-service.
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
      'Error al consultar usuario en auth-service:',
      error.response?.data?.message ?? error.message
    );
    throw error;
  }
};

/**
 * Verifica que el userId corresponda a una cuenta existente.
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
export const userExists = async (userId) => {
  const user = await getUserById(userId);
  return Boolean(user);
};
