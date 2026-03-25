import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  login as loginRequest,
  // register as registerRequest,
  // forgotPassword as forgotPasswordRequest,
  // resetPassword as resetPasswordRequest,
} from "../../../shared/api";

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
            err.response?.data?.message || "Error de autenticación";
          set({ error: message, loading: false });
          return { success: false, error: message };
        }
      },
      // ...rest of store logic
    }),
    { name: "auth-store" },
  ),
);
