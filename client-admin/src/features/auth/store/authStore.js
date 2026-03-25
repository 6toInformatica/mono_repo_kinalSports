import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  login as loginRequest,
  register as registerRequest,
  forgotPassword as forgotPasswordRequest,
  resetPassword as resetPasswordRequest,
} from "../../../service";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      expiresAt: null,
      loading: false,
      error: null,
      isLoadingAuth: true,
      isAuthenticated: false, // Ahora es un valor reactivo

      checkAuth: () => {
        const token = get().token;
        set({
          isLoadingAuth: false,
          isAuthenticated: Boolean(token),
        });
      },

      login: async ({ emailOrUsername, password }) => {
        try {
          set({ loading: true, error: null });

          const { data } = await loginRequest({ emailOrUsername, password });

          set({
            user: data.userDetails,
            token: data.accessToken || data.token,
            refreshToken: data.refreshToken,
            expiresAt: data.expiresIn || data.expiresAt,
            isAuthenticated: true,
            loading: false,
          });

          return { success: true };
        } catch (err) {
          console.error("Login error:", err);

          const message =
            err.response?.data?.message ||
            "Error al iniciar sesión. Intenta nuevamente.";

          set({ error: message, loading: false });

          return { success: false, message };
        }
      },

      setTokens: (accessToken, refreshToken) =>
        set({ token: accessToken, refreshToken }),
      setAccessToken: (token) => set({ token }),

      register: async (formData) => {
        try {
          set({ loading: true, error: null });

          const { data } = await registerRequest(formData);

          set({ loading: false });

          return { success: true, ...data };
        } catch (err) {
          const message =
            err.response?.data?.message ||
            "Error al registrar usuario. Intenta nuevamente.";

          set({ error: message, loading: false });

          return { success: false, message };
        }
      },

      forgotPassword: async (email) => {
        try {
          set({ loading: true, error: null });

          const { data } = await forgotPasswordRequest(email);

          set({ loading: false });

          return { success: true, ...data };
        } catch (err) {
          const message =
            err.response?.data?.message ||
            "Error al enviar correo de recuperación";

          set({ error: message, loading: false });

          return { success: false, message };
        }
      },

      resetPassword: async ({ token, newPassword }) => {
        try {
          set({ loading: true, error: null });

          const { data } = await resetPasswordRequest(token, newPassword);

          set({ loading: false });

          return { success: true, ...data };
        } catch (err) {
          const message =
            err.response?.data?.message || "Error al restablecer contraseña";

          set({ error: message, loading: false });

          return { success: false, message };
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          expiresAt: null,
          isAuthenticated: false,
        });
      },
    }),

    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        expiresAt: state.expiresAt,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
