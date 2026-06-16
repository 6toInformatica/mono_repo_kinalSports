import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { ENDPOINTS } from "../constants/endpoints.js";
import useAuthStore from "../store/authStore.js";

const REFRESH_TOKEN_KEY = "ks_refresh_token";

let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach((pending) => {
    if (error) {
      pending.reject(error);
    } else {
      pending.resolve(token);
    }
  });
  failedQueue = [];
}

export function resolveExpiresAt(expiresIn, expiresAt) {
  if (typeof expiresAt === "number" && expiresAt > 1_000_000_000_000) {
    return expiresAt;
  }
  if (typeof expiresAt === "number" && expiresAt > 1_000_000_000) {
    return expiresAt * 1000;
  }
  const seconds = typeof expiresIn === "number" ? expiresIn : 900;
  return Date.now() + seconds * 1000;
}

export function isAuthError(error) {
  const status = error?.response?.status;
  const code = error?.response?.data?.error;
  return status === 401 || (status === 403 && code === "TOKEN_EXPIRED");
}

const SESSION_EXPIRED_MESSAGE = "Tu sesión expiró. Inicia sesión de nuevo.";

async function persistRefreshResult(data) {
  const accessToken = data.accessToken ?? data.token;
  const refreshToken = data.refreshToken;
  const expiresAt = resolveExpiresAt(data.expiresIn, data.expiresAt);

  if (refreshToken) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  }

  useAuthStore.getState().setAccessToken(accessToken, expiresAt);
  return accessToken;
}

export async function refreshAccessToken() {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;

  try {
    const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      throw new Error("No hay token de actualización almacenado.");
    }

    const { data } = await axios.post(
      `${ENDPOINTS.AUTH}/refresh`,
      { refreshToken },
      { headers: { "Content-Type": "application/json" } },
    );

    const accessToken = await persistRefreshResult(data);
    processQueue(null, accessToken);
    return accessToken;
  } catch (error) {
    processQueue(error, null);
    await useAuthStore.getState().logout({ message: SESSION_EXPIRED_MESSAGE });
    throw error;
  } finally {
    isRefreshing = false;
  }
}

export async function tryRefreshSession() {
  const { isAuthenticated, expiresAt } = useAuthStore.getState();
  if (!isAuthenticated) return;

  const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  if (!refreshToken) return;

  if (expiresAt && expiresAt > Date.now() && Date.now() < expiresAt - 60_000) {
    return;
  }

  return refreshAccessToken();
}

export function attachAuthInterceptor(client, skipRefreshSuffixes = []) {
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      const requestUrl = originalRequest?.url ?? "";
      const shouldSkip = skipRefreshSuffixes.some((suffix) =>
        requestUrl.endsWith(suffix),
      );

      if (!isAuthError(error) || originalRequest?._retry || shouldSkip) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        const token = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return client(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    },
  );
}
