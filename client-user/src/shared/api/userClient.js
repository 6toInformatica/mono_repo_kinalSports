// src/shared/api/userClient.js
import axios from "axios";
import { ENDPOINTS } from "../constants/endpoints.js";
import useAuthStore from "../store/authStore.js";
import { attachAuthInterceptor } from "./tokenRefresh.js";

const userClient = axios.create({
  baseURL: ENDPOINTS.USER,
  timeout: 10_000,
  headers: { "Content-Type": "application/json" },
});

userClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

attachAuthInterceptor(userClient);

export default userClient;
