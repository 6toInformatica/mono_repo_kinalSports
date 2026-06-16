// src/shared/store/authStore.js
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { normalizeAuthUser } from "../utils/authUser.js";
import { resolveExpiresAt } from "../api/tokenRefresh.js";

const REFRESH_TOKEN_KEY = "ks_refresh_token";

const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      expiresAt: null,
      sessionMessage: null,
      _hasHydrated: false,

      login: async (accessToken, user, refreshToken, expiresIn = 900) => {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
        set({
          token: accessToken,
          user: normalizeAuthUser(user, accessToken),
          isAuthenticated: true,
          expiresAt: resolveExpiresAt(expiresIn),
          sessionMessage: null,
        });
      },

      logout: async ({ message } = {}) => {
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          expiresAt: null,
          sessionMessage: message || null,
        });
      },

      setAccessToken: (accessToken, expiresAt) => {
        set((state) => ({
          token: accessToken,
          expiresAt:
            typeof expiresAt === "number" ? expiresAt : resolveExpiresAt(900),
          user: state.user
            ? normalizeAuthUser(state.user, accessToken)
            : state.user,
        }));
      },

      clearSessionMessage: () => set({ sessionMessage: null }),

      updateUser: (userData) => {
        set((state) => ({
          user: normalizeAuthUser({ ...state.user, ...userData }, state.token),
        }));
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        expiresAt: state.expiresAt,
      }),
      onRehydrateStorage: () => (state, _error) => {
        if (state?.token && state?.user) {
          useAuthStore.setState({
            user: normalizeAuthUser(state.user, state.token),
            _hasHydrated: true,
          });
          return;
        }

        useAuthStore.setState({ _hasHydrated: true });
      },
    },
  ),
);

export default useAuthStore;
