"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Carga datos al montar y permite recargarlos. `load` debe ser estable (una función
 * de módulo). `reload({ silent: true })` actualiza sin volver a mostrar el esqueleto,
 * por ejemplo después de confirmar una reserva.
 */
export function useResource<T>(load: () => Promise<T>, initial: T) {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    () =>
      load().then(
        (result) => {
          setData(result);
          setError(null);
        },
        (err: Error) => setError(err.message),
      ),
    [load],
  );

  useEffect(() => {
    void fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const reload = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      await fetchData();
      setLoading(false);
    },
    [fetchData],
  );

  return { data, setData, loading, error, reload };
}
