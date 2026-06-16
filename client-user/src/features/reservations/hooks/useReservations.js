// src/features/reservations/hooks/useReservations.js
import { useState, useCallback, useEffect } from "react";
import userClient from "../../../shared/api/userClient.js";
import { mapReservation } from "../../../shared/utils/reservationFormat.js";

export default function useReservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await userClient.get("/reservations/me/history");
      const raw = response.data.data ?? response.data;
      const mapped = Array.isArray(raw) ? raw.map(mapReservation) : [];
      setReservations(mapped);
    } catch (err) {
      setError(err.response?.data?.message ?? "Error al cargar las reservas");
    } finally {
      setLoading(false);
    }
  }, []);

  const createReservation = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await userClient.post("/reservations", data);
      return response.data.data ?? response.data;
    } catch (err) {
      const msg =
        err.response?.data?.message ??
        err.response?.data?.errors?.[0]?.message ??
        "Error al crear la reserva";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelReservation = useCallback(
    async (id) => {
      setLoading(true);
      setError(null);
      try {
        await userClient.put(`/reservations/${id}/cancel`);
        await fetchReservations();
      } catch (err) {
        setError(err.response?.data?.message ?? "Error al cancelar la reserva");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchReservations],
  );

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  return {
    reservations,
    loading,
    error,
    refetch: fetchReservations,
    createReservation,
    cancelReservation,
  };
}
