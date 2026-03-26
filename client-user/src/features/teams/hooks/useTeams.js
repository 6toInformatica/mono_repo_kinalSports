import { useState, useCallback } from "react";
import userClient from "../../../shared/api/userClient.js";
import { useAuthStore } from "../../../shared/store/authStore.js";

export const useTeams = () => {
  const [teams, setTeams] = useState([]);
  const [myTeams, setMyTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const user = useAuthStore((state) => state.user);

  const getTeams = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userClient.get("/teams");
      setTeams(response.data.data || response.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Error al obtener equipos");
    } finally {
      setLoading(false);
    }
  }, []);

  const getMyTeams = useCallback(async () => {
    if (!user?._id) return;
    try {
      setLoading(true);
      setError(null);
      // Actualizado según las rutas de server-user (/teams/me/mis-equipos)
      const response = await userClient.get("/teams/me/mis-equipos");
      setMyTeams(response.data.data || response.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Error al obtener tus equipos");
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  const joinTeam = async (teamId) => {
    try {
      setLoading(true);
      // Actualizado según las rutas de server-user (POST /teams/:id/join)
      await userClient.post(`/teams/${teamId}/join`);
      await getTeams();
      await getMyTeams();
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const leaveTeam = async (teamId) => {
    try {
      setLoading(true);
      // Actualizado según las rutas de server-user (POST /teams/:id/leave)
      await userClient.post(`/teams/${teamId}/leave`);
      await getTeams();
      await getMyTeams();
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createTeam = async (data) => {
    try {
      setLoading(true);
      const isFormData = data && data.append;
      await userClient.post("/teams", data, {
        headers: isFormData
          ? { "Content-Type": "multipart/form-data" }
          : undefined,
      });
      await getTeams();
      await getMyTeams();
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    teams,
    myTeams,
    loading,
    error,
    getTeams,
    getMyTeams,
    joinTeam,
    leaveTeam,
    createTeam,
  };
};
