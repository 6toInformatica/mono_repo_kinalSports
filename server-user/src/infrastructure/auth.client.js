'use strict';

import axios from 'axios';

/**
 * Cliente de los servicios de autenticación (auth-node, o auth-service como alternativa).
 * Las consultas profile/by-* requieren el token interno entre servicios.
 */
const authBaseUrl =
  process.env.AUTH_NODE_URL ??
  process.env.AUTH_SERVICE_URL ??
  'http://localhost:3007/api/v1';

const authClient = axios.create({
  baseURL: authBaseUrl,
  headers: { 'Content-Type': 'application/json' },
});

authClient.interceptors.request.use((config) => {
  const internalToken = process.env.INTERNAL_SERVICE_TOKEN;
  if (internalToken) config.headers['x-internal-token'] = internalToken;
  return config;
});

/** Usuario de auth por id; null si no existe o si el servicio falla */
export const getUserById = async (userId) => {
  try {
    const { data } = await authClient.post('/auth/profile/by-id', { userId });
    return data?.data ?? null;
  } catch (error) {
    if (error.response?.status !== 404) {
      console.error(
        'Error al consultar usuario en auth-node:',
        error.response?.data?.message ?? error.message
      );
    }
    return null;
  }
};

/** Usuario de auth por username; null si no existe o si el servicio falla */
export const getUserByUsername = async (username) => {
  try {
    const { data } = await authClient.post('/auth/profile/by-username', {
      username: username.trim(),
    });
    return data?.data ?? null;
  } catch (error) {
    if (error.response?.status !== 404) {
      console.error(
        'Error al buscar usuario por username en auth-node:',
        error.response?.data?.message ?? error.message
      );
    }
    return null;
  }
};

/**
 * Reenvía la foto de perfil al servicio de auth con el token del propio usuario.
 * Si auth responde con error, se lanza con su status y mensaje.
 */
export const uploadProfilePicture = async (file, authorizationHeader) => {
  const formData = new FormData();
  formData.append(
    'profilePicture',
    new Blob([file.buffer], { type: file.mimetype }),
    file.originalname
  );

  const response = await fetch(`${authBaseUrl}/auth/profile/picture`, {
    method: 'POST',
    headers: { Authorization: authorizationHeader },
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      data.message || 'Error al actualizar foto de perfil'
    );
    error.status = response.status;
    error.response = { status: response.status, data };
    throw error;
  }

  return data?.data ?? data;
};

// Caché corta de perfiles públicos para enriquecer equipos: evita repetir una consulta
// por miembro en cada vista (agotaba el rate limit de auth y los nombres salían como
// "Miembro"). Solo se guardan los usuarios encontrados.
const PROFILE_CACHE_TTL_MS = 60_000;
const PROFILE_CACHE_MAX = 1000;
const profileCache = new Map();

const getCachedUserById = (userId) => {
  const key = String(userId);
  const hit = profileCache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.promise;

  if (profileCache.size >= PROFILE_CACHE_MAX) profileCache.clear();

  const promise = getUserById(key).then((user) => {
    if (!user) profileCache.delete(key);
    return user;
  });
  profileCache.set(key, {
    promise,
    expiresAt: Date.now() + PROFILE_CACHE_TTL_MS,
  });
  return promise;
};

/**
 * Perfiles de varios usuarios: una sola consulta por id distinto (con caché de 60 s).
 * Devuelve un Map id → perfil (o null si no se encontró).
 */
export const getUsersByIds = async (userIds) => {
  const uniqueIds = [...new Set(userIds.filter(Boolean).map(String))];
  const profiles = await Promise.all(uniqueIds.map(getCachedUserById));
  return new Map(uniqueIds.map((id, index) => [id, profiles[index]]));
};
