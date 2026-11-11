'use strict';

import axios from 'axios';

/** Cliente de server-admin (fuente de verdad de los torneos), con el token interno */
const adminClient = axios.create({
  baseURL: process.env.ADMIN_SERVICE_URL,
  headers: { 'Content-Type': 'application/json' },
});

adminClient.interceptors.request.use((config) => {
  const internalToken = process.env.INTERNAL_SERVICE_TOKEN;
  if (internalToken) config.headers['x-internal-token'] = internalToken;
  return config;
});

/**
 * Torneo según server-admin. Devuelve el cuerpo de la respuesta; lanza el error de
 * axios tal cual para que el servicio decida qué significa cada status.
 */
export const getAdminTournament = async (tournamentId) => {
  const { data } = await adminClient.get(`/tournaments/${tournamentId}`);
  return data;
};
