// src/features/teams/hooks/useTeams.js
import { useState, useCallback, useEffect } from "react";
import userClient from "../../../shared/api/userClient.js";
import useAuthStore from "../../../shared/store/authStore.js";
import { getAuthUserId } from "../../../shared/utils/authUser.js";

export default function useTeams() {
  const [teams, setTeams] = useState([]);
  const [myTeams, setMyTeams] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const fetchTeams = useCallback(async () => {
    setListLoading(true);
    setError(null);
    try {
      const response = await userClient.get("/teams");
      setTeams(response.data.data ?? response.data ?? []);
    } catch (err) {
      setError(err.response?.data?.message ?? "Error al cargar los equipos");
    } finally {
      setListLoading(false);
    }
  }, []);

  const fetchMyTeams = useCallback(async () => {
    const userId = getAuthUserId(user, token);
    if (!userId) return;
    setListLoading(true);
    setError(null);
    try {
      const response = await userClient.get("/teams/me/mis-equipos");
      setMyTeams(response.data.data ?? response.data ?? []);
    } catch (err) {
      setError(err.response?.data?.message ?? "Error al cargar mis equipos");
    } finally {
      setListLoading(false);
    }
  }, [token, user]);

  const fetchTeamById = useCallback(async (id) => {
    setActionLoading(true);
    setError(null);
    try {
      const response = await userClient.get(`/teams/${id}`);
      return response.data.data ?? response.data;
    } catch (err) {
      setError(err.response?.data?.message ?? "Error al cargar el equipo");
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, []);

  const joinTeam = useCallback(async (id) => {
    setActionLoading(true);
    setError(null);
    try {
      const response = await userClient.post(`/teams/${id}/join`);
      return response.data.data ?? response.data;
    } catch (err) {
      setError(err.response?.data?.message ?? "Error al unirse al equipo");
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, []);

  const leaveTeam = useCallback(async (id) => {
    setActionLoading(true);
    setError(null);
    try {
      await userClient.post(`/teams/${id}/leave`);
    } catch (err) {
      setError(err.response?.data?.message ?? "Error al salir del equipo");
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, []);

  const createTeam = useCallback(async (formData) => {
    setActionLoading(true);
    setError(null);
    try {
      const response = await userClient.post("/teams", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data.data ?? response.data;
    } catch (err) {
      setError(err.response?.data?.message ?? "Error al crear el equipo");
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, []);

  const addNamedMember = useCallback(async (teamId, name) => {
    setActionLoading(true);
    setError(null);
    try {
      const response = await userClient.post(`/teams/${teamId}/named-members`, {
        name,
      });
      return response.data.data ?? response.data;
    } catch (err) {
      setError(err.response?.data?.message ?? "Error al agregar miembro");
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, []);

  const removeNamedMember = useCallback(async (teamId, memberId) => {
    setActionLoading(true);
    setError(null);
    try {
      const response = await userClient.delete(
        `/teams/${teamId}/named-members/${memberId}`,
      );
      return response.data.data ?? response.data;
    } catch (err) {
      setError(err.response?.data?.message ?? "Error al eliminar miembro");
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, []);

  const addAppMember = useCallback(async (teamId, username) => {
    setActionLoading(true);
    setError(null);
    try {
      const response = await userClient.post(`/teams/${teamId}/members`, {
        username,
      });
      return response.data.data ?? response.data;
    } catch (err) {
      setError(err.response?.data?.message ?? "Error al agregar usuario");
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, []);

  const removeAppMember = useCallback(async (teamId, memberUserId) => {
    setActionLoading(true);
    setError(null);
    try {
      const response = await userClient.delete(
        `/teams/${teamId}/members/${memberUserId}`,
      );
      return response.data.data ?? response.data;
    } catch (err) {
      setError(err.response?.data?.message ?? "Error al eliminar usuario");
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const clearError = useCallback(() => setError(null), []);

  return {
    teams,
    myTeams,
    loading: listLoading,
    listLoading,
    actionLoading,
    error,
    clearError,
    refetch: fetchTeams,
    fetchMyTeams,
    fetchTeamById,
    joinTeam,
    leaveTeam,
    createTeam,
    addNamedMember,
    removeNamedMember,
    addAppMember,
    removeAppMember,
  };
}
