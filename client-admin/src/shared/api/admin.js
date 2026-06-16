import { axiosAdmin } from './api';

// ================= TOURNAMENTS =================
export const getTournaments = async () => {
  return await axiosAdmin.get('/tournaments');
};

export const createTournament = async (data) => {
  return await axiosAdmin.post('/tournaments', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const updateTournament = async (id, data) => {
  return await axiosAdmin.put(`/tournaments/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const deleteTournament = async (id) => {
  return await axiosAdmin.put(`/tournaments/${id}/deactivate`);
};

// ================= TEAMS =================
export const getTeams = async (params = {}) => {
  return await axiosAdmin.get('/teams', { params });
};

export const createTeam = async (data) => {
  return await axiosAdmin.post('/teams', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const updateTeam = async (id, data) => {
  return await axiosAdmin.put(`/teams/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const deleteTeam = async (id) => {
  return await axiosAdmin.put(`/teams/${id}/deactivate`);
};

export const addTeamNamedMember = async (teamId, name) => {
  return await axiosAdmin.post(`/teams/${teamId}/named-members`, { name });
};

export const removeTeamNamedMember = async (teamId, memberId) => {
  return await axiosAdmin.delete(`/teams/${teamId}/named-members/${memberId}`);
};

// ================= FIELDS =================
export const getFields = async () => {
  return await axiosAdmin.get('/fields');
};

export const createField = async (data) => {
  return await axiosAdmin.post('/fields', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const updateField = async (id, data) => {
  return await axiosAdmin.put(`/fields/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const deleteField = async (id) => {
  return await axiosAdmin.put(`/fields/${id}/deactivate`);
};

// ================= RESERVATIONS =================
export const getAllReservations = async (params = { page: 1, limit: 100 }) => {
  return await axiosAdmin.get('/reservations', { params });
};

export const confirmReservation = async (id) => {
  return await axiosAdmin.put(`/reservations/${id}/confirm`);
};

export const cancelReservation = async (id) => {
  return await axiosAdmin.put(`/reservations/${id}/cancel`);
};
