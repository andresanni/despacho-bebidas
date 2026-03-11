import { useState, useEffect } from "react";
import { useAppStore } from "../store/useAppStore";
import { getAll } from "../services/baseService";
import { supabase } from "../lib/supabase";
import type { Mozo, Bebida, Jornada, Operacion } from "../types";

interface UseAppInitResult {
  loading: boolean;
  error: string | null;
}

export function useAppInit(): UseAppInitResult {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const {
    setMozos,
    setBebidas,
    setJornadaActiva,
    setJornadaSeleccionada,
    setOperacionesActivas,
  } = useAppStore();

  useEffect(() => {
    let isMounted = true;

    async function initializeApp() {
      try {
        setLoading(true);
        setError(null);

        // Disparamos las tres consultas en paralelo
        const [mozosResult, bebidasResult, jornadaResult] = await Promise.all([
          getAll<Mozo>("mozos"),
          getAll<Bebida>("bebidas"),
          supabase
            .from("jornadas")
            .select("*")
            .eq("estado", "abierta")
            .maybeSingle(),
        ]);

        if (isMounted) {
          // Guardamos en el store de Zustand
          setMozos(mozosResult);
          setBebidas(bebidasResult);

          if (jornadaResult.error) {
            throw jornadaResult.error;
          }

          setJornadaActiva(jornadaResult.data as Jornada | null);

          // Por defecto, si hay una activa, que sea esa la que mires al entrar a /despacho
          setJornadaSeleccionada(jornadaResult.data as Jornada | null);

          if (jornadaResult.data) {
            const { data: operacionesData, error: operacionesError } =
              await supabase
                .from("operaciones")
                .select("*")
                .eq("jornada_id", jornadaResult.data.id);

            if (operacionesError) {
              throw operacionesError;
            }

            setOperacionesActivas(operacionesData as Operacion[]);
          } else {
            setOperacionesActivas([]);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("Error al inicializar la aplicación:", err);
          setError(err.message || "Se produjo un error al cargar los datos.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    initializeApp();

    return () => {
      isMounted = false;
    };
  }, [
    setMozos,
    setBebidas,
    setJornadaActiva,
    setJornadaSeleccionada,
    setOperacionesActivas,
  ]);

  return { loading, error };
}
