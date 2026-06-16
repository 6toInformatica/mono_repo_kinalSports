// src/shared/api/authClient.js
import axios from "axios";
import { ENDPOINTS } from "../constants/endpoints.js";
import useAuthStore from "../store/authStore.js";
import { attachAuthInterceptor, tryRefreshSession } from "./tokenRefresh.js";

const SKIP_REFRESH_SUFFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/resend-verification",
];

const authClient = axios.create({
  baseURL: ENDPOINTS.AUTH,
  timeout: 10_000,
  headers: { "Content-Type": "application/json" },
});

authClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

attachAuthInterceptor(authClient, SKIP_REFRESH_SUFFIXES);

export { tryRefreshSession };
export default authClient;
