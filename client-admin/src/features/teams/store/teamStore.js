import { create } from 'zustand';
import {
  getTeams as getTeamsRequest,
  createTeam as createTeamRequest,
  updateTeam as updateTeamRequest,
  deleteTeam as deleteTeamRequest,
} from '../../../shared/api';
import { isAuthError } from '../../../shared/api/sessionRefresh.js';

export const useTeamsStore = create((set, get) => ({
  teams: [],
  loading: false,
  error: null,

  getTeams: async () => {
    try {
      set({ loading: true, error: null });

      let page = 1;
      let allTeams = [];
      let totalPages = 1;

      do {
        const response = await getTeamsRequest({ page, limit: 100 });
        const teamsPage = response.data.data ?? [];
        allTeams = [...allTeams, ...teamsPage];
        totalPages = response.data.pagination?.totalPages ?? 1;
        page += 1;
      } while (page <= totalPages);

      set({
        teams: allTeams,
        loading: false,
      });
    } catch (error) {
      if (isAuthError(error)) {
        set({ teams: [], loading: false, error: null });
        return;
      }
      set({
        error: error.response?.data?.message || 'Error al obtener equipos',
        loading: false,
      });
    }
  },

  createTeam: async (formData) => {
    try {
      set({ loading: true, error: null });

      const response = await createTeamRequest(formData);

      set({
        teams: [response.data.data, ...get().teams],
        loading: false,
      });
    } catch (error) {
      set({
        loading: false,
        error: error.response?.data?.message || 'Error al crear equipo',
      });
      throw error;
    }
  },

  updateTeam: async (id, data) => {
    try {
      set({ loading: true, error: null });

      const response = await updateTeamRequest(id, data);

      set({
        teams: get().teams.map((team) => (team._id === id ? response.data.data : team)),
        loading: false,
      });
    } catch (error) {
      set({
        loading: false,
        error: error.response?.data?.message || 'Error al actualizar equipo',
      });
      throw error;
    }
  },

  deleteTeam: async (id) => {
    try {
      set({ loading: true, error: null });

      await deleteTeamRequest(id);

      set({
        teams: get().teams.filter((team) => team._id !== id),
        loading: false,
      });
    } catch (error) {
      set({
        loading: false,
        error: error.response?.data?.message || 'Error al desactivar equipo',
      });
      throw error;
    }
  },
}));
