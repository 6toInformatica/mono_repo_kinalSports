import { useState } from "react";
import authClient from "../api/authClient";
import { useAuthStore } from "../store/authStore";

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);

  const handleLogin = async (data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authClient.post("/login", data);
      const { token, user } = response.data;
      login(token, user);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Error al iniciar sesión");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authClient.post("/register", data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Error al registrarse");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { handleLogin, handleRegister, loading, error, logout };
};
