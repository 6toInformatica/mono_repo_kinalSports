import axios from "axios";
import { ENDPOINTS } from "../constants/endpoints";
import { useAuthStore } from "../store/authStore";

const userClient = axios.create({
  baseURL: ENDPOINTS.USER,
  headers: {
    "Content-Type": "application/json",
  },
});

userClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

userClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido, desconectar al usuario
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);

export default userClient;
