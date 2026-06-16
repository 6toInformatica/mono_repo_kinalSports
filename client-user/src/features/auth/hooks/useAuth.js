// src/features/auth/hooks/useAuth.js
import { useState } from "react";
import authClient from "../../../shared/api/authClient.js";
import useAuthStore from "../../../shared/store/authStore.js";

export default function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);

  /**
   * Inicia sesión. Tolera respuesta con forma:
   *   { accessToken, refreshToken, userDetails }  ← formato preferido
   *   { token, user }                              ← formato alternativo
   */
  const handleLogin = async ({ emailOrUsername, password }) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await authClient.post("/login", {
        emailOrUsername,
        password,
      });

      const accessToken = data.accessToken ?? data.token;
      const refreshToken = data.refreshToken ?? "";
      const user = data.userDetails ?? data.user ?? {};
      const expiresIn = data.expiresIn ?? 900;

      await login(accessToken, user, refreshToken, expiresIn);
    } catch (err) {
      const message =
        err.response?.data?.message ??
        "Error al iniciar sesión. Intenta de nuevo.";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Registra un nuevo usuario.
   * @param {{ name, surname, username, email, password, phone }} formData
   * @returns {Promise<object>} data de la respuesta
   */
  const handleRegister = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await authClient.post("/register", formData);
      return data;
    } catch (err) {
      const message =
        err.response?.data?.message ??
        "Error al registrarse. Intenta de nuevo.";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { handleLogin, handleRegister, loading, error, logout };
}
