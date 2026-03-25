import { useState, useCallback } from "react";
import userClient from "../api/userClient";

export const useReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getReservations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userClient.get("/reservations/my-reservations");
      setReservations(response.data.data || response.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Error al obtener reservaciones");
    } finally {
      setLoading(false);
    }
  }, []);

  const createReservation = async (reservationData) => {
    try {
      setLoading(true);
      const response = await userClient.post("/reservations", reservationData);
      await getReservations();
      return response.data;
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { reservations, loading, error, getReservations, createReservation };
};
