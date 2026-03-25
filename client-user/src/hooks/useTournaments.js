import { useState, useCallback } from "react";
import userClient from "../api/userClient";

export const useTournaments = () => {
  const [tournaments, setTournaments] = useState([]);
  const [myTournaments, setMyTournaments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getTournaments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userClient.get("/tournaments");
      setTournaments(response.data.data || response.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Error al obtener torneos");
    } finally {
      setLoading(false);
    }
  }, []);

  const getMyTournaments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userClient.get("/tournaments/my-tournaments");
      setMyTournaments(response.data.data || response.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Error al obtener tus torneos");
    } finally {
      setLoading(false);
    }
  }, []);

  const registerTeam = async (tournamentId, teamId) => {
    try {
      setLoading(true);
      await userClient.post(`/tournaments/register/${tournamentId}`, {
        teamId,
      });
      await getTournaments();
      await getMyTournaments();
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    tournaments,
    myTournaments,
    loading,
    error,
    getTournaments,
    getMyTournaments,
    registerTeam,
  };
};
