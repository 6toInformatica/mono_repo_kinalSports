import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  forgotPassword as forgotPasswordRequest,
  resetPassword as resetPasswordRequest,
} from '../../../shared/api';
import { resolveExpiresAt } from '../../../shared/api/sessionRefresh.js';
import { resetAppStores } from '../../../shared/store/resetAppStores.js';
import { showError } from '../../../shared/utils/toast.js';

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
      isAuthenticated: false,
      sessionMessage: null,
      checkAuth: () => {
        const user = get().user;
        const role = user?.role;
        const isAdmin = role === 'ADMIN_ROLE';

        // Si hay sesión pero el rol no es admin, limpiamos la sesión.
        if (user && !isAdmin) {
          set({
            user: null,
            token: null,
            refreshToken: null,
            expiresAt: null,
            isAuthenticated: false,
            isLoadingAuth: false,
            error: 'No tienes permisos para acceder como administrador.',
          });
          return;
        }

        set({
          isLoadingAuth: false,
          isAuthenticated: Boolean(user) && isAdmin,
        });
      },

      logout: ({ message } = {}) => {
        logoutRequest().catch(() => undefined);
        resetAppStores();
        set({
          user: null,
          token: null,
          refreshToken: null,
          expiresAt: null,
          isAuthenticated: false,
          sessionMessage: message || null,
        });
      },

      clearSessionMessage: () => set({ sessionMessage: null }),
      login: async ({ emailOrUsername, password }) => {
        try {
          set({ loading: true, error: null });
          const { data } = await loginRequest({ emailOrUsername, password });

          // Sólo administradores pueden iniciar sesión en el client-admin.
          const role = data?.userDetails?.role;
          if (role !== 'ADMIN_ROLE') {
            const message = 'No tienes permisos para acceder como administrador.';
            logoutRequest().catch(() => undefined);

            set({
              user: null,
              token: null,
              refreshToken: null,
              expiresAt: null,
              isAuthenticated: false,
              loading: false,
              error: message,
            });

            showError(message);
            return { success: false, error: message };
          }

          // Los tokens viajan en cookies httpOnly (kinal_access y kinal_refresh) emitidas
          // por el backend; no se persisten en localStorage para evitar robo por XSS.
          set({
            user: data.userDetails,
            token: null,
            refreshToken: null,
            expiresAt: resolveExpiresAt(data.expiresIn, data.expiresAt),
            isAuthenticated: true,
            loading: false,
            sessionMessage: null,
          });
          return { success: true };
        } catch (err) {
          console.error('Login error:', err);
          const message = err.response?.data?.message || 'Error de autenticación';
          set({ error: message, loading: false });
          return { success: false, error: message };
        }
      },
      register: async (formData) => {
        try {
          set({ loading: true, error: null });
          const { data } = await registerRequest(formData);
          set({ loading: false });
          return {
            success: true,
            emailVerificationRequired: data?.emailVerificationRequired,
            data,
          };
        } catch (err) {
          const message = err.response?.data?.message || 'Error al registrarse';
          set({ error: message, loading: false });
          return { success: false, error: message };
        }
      },
      forgotPassword: async (email) => {
        try {
          set({ loading: true, error: null });
          const { data } = await forgotPasswordRequest(email);
          set({ loading: false });
          return { success: true, data };
        } catch (err) {
          const message = err.response?.data?.message || 'Error al enviar el correo';
          set({ error: message, loading: false });
          return { success: false, error: message };
        }
      },
      resetPassword: async ({ token, newPassword }) => {
        try {
          set({ loading: true, error: null });
          const { data } = await resetPasswordRequest(token, newPassword);
          set({ loading: false });
          return { success: true, data };
        } catch (err) {
          const message = err.response?.data?.message || 'Error al restablecer contraseña';
          set({ error: message, loading: false });
          return { success: false, error: message };
        }
      },
    }),
    {
      name: 'auth-store',
      // Seguridad (XSS): antes se persistían token y refreshToken en localStorage;
      // ahora viven únicamente en cookies httpOnly y aquí solo se guardan metadatos de UI.
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        expiresAt: state.expiresAt,
      }),
    }
  )
);
