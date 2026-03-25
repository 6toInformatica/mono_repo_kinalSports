import axios from "axios";
import { useAuthStore } from "../features/auth/store/authStore.js";

const axiosAuth = axios.create({
  baseURL: import.meta.env.VITE_AUTH_URL,
  timeout: 8000,
  headers: {
    "Content-Type": "application/json",
  },
});

const axiosAdmin = axios.create({
  baseURL: import.meta.env.VITE_ADMIN_URL,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosAuth.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosAdmin.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Refresh token logic
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token),
  );
  failedQueue = [];
}

axiosAuth.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url.includes("/auth/refresh")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return axiosAuth(original);
        });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) throw new Error("No refresh token");
        const { data } = await axios.post(
          `${import.meta.env.VITE_AUTH_URL}/auth/refresh`,
          { refreshToken },
        );
        useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);
        processQueue(null, data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return axiosAuth(original);
      } catch (err) {
        processQueue(err, null);
        useAuthStore.getState().logout();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);

export const login = async (data) => {
  return await axiosAuth.post("/auth/login", data);
};

export const register = async (data) => {
  return await axiosAuth.post("/auth/register", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const verifyEmail = async (token) => {
  return await axiosAuth.post("/auth/verify-email", { token });
};

export const getAllUsers = async () => {
  return await axiosAuth.get("/auth/users");
};

export const forgotPassword = async (email) => {
  return await axiosAuth.post("/auth/forgot-password", { email });
};

export const resetPassword = async (token, newPassword) => {
  return await axiosAuth.post("/auth/reset-password", { token, newPassword });
};

export const changeUserRole = async (userId, roleName) => {
  return await axiosAuth.put(`/users/${userId}/role`, { roleName });
};

export const getFields = async () => {
  return await axiosAdmin.get("/fields");
};

export const createField = async (data) => {
  return await axiosAdmin.post("/fields", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const updateField = async (id, data) => {
  return await axiosAdmin.put(`/fields/${id}`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const deleteField = async (id) => {
  return await axiosAdmin.put(`/fields/${id}/deactivate`);
};

export const getAllReservations = async () => {
  return await axiosAdmin.get("/reservations");
};

export const confirmReservation = async (id) => {
  return await axiosAdmin.put(`/reservations/${id}/confirm`);
};

export const getTeams = async () => {
  return await axiosAdmin.get("/teams");
};

export const createTeam = async (data) => {
  return await axiosAdmin.post("/teams", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const updateTeam = async (id, data) => {
  return await axiosAdmin.put(`/teams/${id}`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const deleteTeam = async (id) => {
  return await axiosAdmin.put(`/teams/${id}/deactivate`);
};

export const getTournaments = async () => {
  return await axiosAdmin.get("/tournaments");
};

export const createTournament = async (data) => {
  return await axiosAdmin.post("/tournaments", data);
};

export const updateTournament = async (id, data) => {
  return await axiosAdmin.put(`/tournaments/${id}`, data);
};

export const deleteTournament = async (id) => {
  return await axiosAdmin.put(`/tournaments/${id}/deactivate`);
};
