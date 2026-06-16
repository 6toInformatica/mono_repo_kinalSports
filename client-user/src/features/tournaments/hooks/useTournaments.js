// src/features/tournaments/hooks/useTournaments.js
import { useState, useCallback, useEffect } from "react";
import userClient from "../../../shared/api/userClient.js";
import { mapTournament } from "../../../shared/utils/tournamentFormat.js";

export default function useTournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [myTournaments, setMyTournaments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTournaments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await userClient.get("/tournaments");
      const raw = response.data.data ?? response.data ?? [];
      setTournaments(Array.isArray(raw) ? raw.map(mapTournament) : []);
    } catch (err) {
      setError(err.response?.data?.message ?? "Error al cargar los torneos");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyTournaments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await userClient.get("/tournaments/me/mis-torneos");
      const raw = response.data.data ?? response.data ?? [];
      setMyTournaments(Array.isArray(raw) ? raw.map(mapTournament) : []);
    } catch (err) {
      setError(err.response?.data?.message ?? "Error al cargar mis torneos");
    } finally {
      setLoading(false);
    }
  }, []);

  const registerToTournament = useCallback(async (tournamentId, teamId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await userClient.post(
        `/tournaments/${tournamentId}/register`,
        { teamId },
      );
      return response.data.data ?? response.data;
    } catch (err) {
      setError(err.response?.data?.message ?? "Error al inscribirse al torneo");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  return {
    tournaments,
    myTournaments,
    loading,
    error,
    refetch: fetchTournaments,
    fetchMyTournaments,
    registerToTournament,
  };
}
