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
export const verifyEmail = async (token) => {
  return await axiosAuth.post("/auth/verify-email", { token });
};
import axios from "axios";
import { useAuthStore } from "../../features/auth/store/authStore.js";

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

let _isRefreshing = false;
let failedQueue = [];

function _processQueue(_error, token = null) {
  failedQueue.forEach(({ resolve, reject }) =>
    _error ? reject(_error) : resolve(token),
  );
  failedQueue = [];
}

axiosAuth.interceptors.response.use(
  (res) => res,
  async (_error) => {
    const _original = _error.config;
    // ...rest of logic
  },
);

export { axiosAuth, axiosAdmin };

export const login = async (data) => {
  return await axiosAuth.post("/auth/login", data);
};

export const register = async (data) => {
  return await axiosAuth.post("/auth/register", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const forgotPassword = async (email) => {
  return await axiosAuth.post("/auth/forgot-password", { email });
};

export const resetPassword = async (token, newPassword) => {
  return await axiosAuth.post("/auth/reset-password", { token, newPassword });
};
