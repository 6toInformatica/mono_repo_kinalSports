// ================= IMPORTS =================
import axios from 'axios';
import { useAuthStore } from '../../features/auth/store/authStore.js';
import { isAuthError, performTokenRefresh, tryRefreshSession } from './sessionRefresh.js';

// ================= AXIOS INSTANCES =================
const axiosAuth = axios.create({
  baseURL: import.meta.env.VITE_AUTH_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const axiosAdmin = axios.create({
  baseURL: import.meta.env.VITE_ADMIN_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ================= REQUEST INTERCEPTORS =================
axiosAuth.interceptors.request.use((config) => {
  config._axiosClient = 'auth';
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosAdmin.interceptors.request.use((config) => {
  config._axiosClient = 'admin';
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const handleRefreshToken = async function (error) {
  const original = error.config;
  if (!original || original._retry) {
    return Promise.reject(error);
  }

  const requestUrl = original.url || '';
  const isRefreshEndpoint = requestUrl.includes('/auth/refresh');

  if (!isAuthError(error) || isRefreshEndpoint) {
    return Promise.reject(error);
  }

  const retryClient = original._axiosClient === 'admin' ? axiosAdmin : axiosAuth;

  original._retry = true;

  try {
    const accessToken = await performTokenRefresh(axiosAuth);
    original.headers.Authorization = `Bearer ${accessToken}`;
    return retryClient(original);
  } catch (refreshError) {
    return Promise.reject(refreshError);
  }
};

axiosAuth.interceptors.response.use((res) => res, handleRefreshToken);
axiosAdmin.interceptors.response.use((res) => res, handleRefreshToken);

export { axiosAuth, axiosAdmin, handleRefreshToken, tryRefreshSession, isAuthError };
export { performTokenRefresh };
