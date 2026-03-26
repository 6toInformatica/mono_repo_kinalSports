import { create } from "zustand";
import axios from "../../../shared/axios.js";

export const useUserManagementStore = create((set, get) => ({
  /**
   * Cambia el rol de un usuario usando la API de auth-service (.NET)
   * @param {string} userId
   * @param {string} newRole "ADMIN_ROLE" o "USER_ROLE"
   * @param {string} token JWT de autenticación
   */
  updateUserRole: async (userId, newRole, token) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_AUTH_SERVICE_URL || "http://localhost:5000"}/api/v1/Users/${userId}/role`,
        { roleName: newRole },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      // Actualizar el usuario en el estado local
      const updatedUser = response.data;
      const users = get().users.map((u) =>
        u.id === updatedUser.id ? { ...u, role: updatedUser.role } : u,
      );
      set({ users, loading: false });
      return { success: true, user: updatedUser };
    } catch (err) {
      set({
        error:
          err.response?.data?.message || err.message || "Error al cambiar rol",
        loading: false,
      });
      return {
        success: false,
        error: err.response?.data?.message || err.message,
      };
    }
  },
  users: [],
  loading: false,
  error: null,
  filters: {},

  setFilters: (filters) => set({ filters }),

  setUsers: (users) => set({ users }),

  fetchUsers: async (apiFn) => {
    set({ loading: true, error: null });
    try {
      const result = await apiFn();
      set({ users: result.users || result, loading: false });
    } catch (err) {
      set({ error: err.message || "Error al cargar usuarios", loading: false });
    }
  },
}));
