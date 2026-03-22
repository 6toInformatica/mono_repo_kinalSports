
import axios from "axios";
import { useAuthStore } from "../features/auth/store/authStore.js";

const axiosAuth = axios.create({
  baseURL: "http://localhost:5156/api/v1",
  timeout: 8000,
  headers: {
    "Content-Type": "application/json",
  },
});

const axiosAdmin = axios.create({
  baseURL: "http://localhost:3006/kinalSportsAdmin/v1",
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
}

export const getAllUsers = async () => {
  return await axiosAuth.get("/auth/users");
}

export const forgotPassword = async (email) => {
  return await axiosAuth.post("/auth/forgot-password", { email });
}

export const resetPassword = async (token, newPassword) => {
  return await axiosAuth.post("/auth/reset-password", {token, newPassword})
}

export const changeUserRole = async (userId, roleName) => {
  return await axiosAuth.put(`/users/${userId}/role`, {
    roleName,
  });
};

export const getFields = async () => {
  return await axiosAdmin.get("/fields");
}

export const createField = async (data) => {
  return await axiosAdmin.post("/fields", data, {
    headers: { "Content-Type": "multipart/form-data" },
  })
}

export const updateField = async (id, data) => {
  return await axiosAdmin.put(`/fields/${id}`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  })
}

export const deleteField = async (id) => {
  return await axiosAdmin.put(`/fields/${id}/deactivate`);
}

export const getAllReservations = async () => {
  return await axiosAdmin.get("/reservations");
}

export const confirmReservation = async (id) => {
  return await axiosAdmin.put(`/reservations/${id}/confirm`);
}