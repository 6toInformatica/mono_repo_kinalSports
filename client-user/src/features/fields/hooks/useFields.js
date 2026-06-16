// src/features/fields/hooks/useFields.js
import { useState, useCallback, useEffect } from "react";
import userClient from "../../../shared/api/userClient.js";

export default function useFields() {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFields = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await userClient.get("/fields");
      const raw = response.data.data ?? response.data;
      const mapped = Array.isArray(raw)
        ? raw.map((f) => ({
            ...f,
            name: f.fieldName ?? f.name,
            image: f.photo ?? f.image ?? null,
            location: `${f.fieldType ?? ""} • ${f.capacity ?? ""}`.trim(),
            isAvailable: Boolean(f.isActive ?? f.isAvailable),
            price: f.pricePerHour ?? f.price ?? null,
          }))
        : [];
      setFields(mapped);
    } catch (err) {
      setError(err.response?.data?.message ?? "Error al cargar las canchas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFields();
  }, [fetchFields]);

  return { fields, loading, error, refetch: fetchFields };
}
