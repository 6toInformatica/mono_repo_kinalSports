import { useState, useEffect, useCallback } from "react";
import userClient from "../../../shared/api/userClient";

export const useFields = () => {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getFields = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userClient.get("/fields");
      // Adjust according to API response structure
      setFields(response.data.data || response.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Error al obtener canchas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getFields();
  }, [getFields]);

  return { fields, loading, error, getFields };
};
