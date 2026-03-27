import { useState, useCallback } from "react";
import userClient from "../../../shared/api/userClient.js";

const mapReservationToViewModel = (reservation) => {
  const field = reservation.fieldId;
  return {
    ...reservation,
    field: field
      ? {
          id: field._id,
          name: field.fieldName,
          image: field.photo,
        }
      : null,
    normalizedStatus: (reservation.status || "").toUpperCase(),
  };
};

export const useReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getReservations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userClient.get("/reservations/me/history");
      const rawReservations = response.data.data || response.data || [];
      setReservations(rawReservations.map(mapReservationToViewModel));
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

  const cancelReservation = async (reservationId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await userClient.put(
        `/reservations/${reservationId}/cancel`,
      );
      await getReservations();
      return response.data;
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Error al cancelar la reservación",
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    reservations,
    loading,
    error,
    getReservations,
    createReservation,
    cancelReservation,
  };
};
