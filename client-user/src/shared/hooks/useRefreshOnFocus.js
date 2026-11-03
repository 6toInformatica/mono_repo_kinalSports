// src/shared/hooks/useRefreshOnFocus.js
import { useCallback, useRef } from "react";
import { useFocusEffect } from "@react-navigation/native";

/**
 * Vuelve a cargar los datos cuando la pantalla recupera el foco
 * (ej. al regresar de crear una reserva o un equipo).
 * Se omite el primer foco porque los hooks de datos ya cargan al montar.
 * @param {() => unknown} refetch
 */
export default function useRefreshOnFocus(refetch) {
  const isFirstFocus = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      refetch();
    }, [refetch]),
  );
}
