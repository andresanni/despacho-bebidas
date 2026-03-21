import { create } from "zustand";
import type { Mozo, Bebida, Jornada, Operacion, ItemOperacion } from "../types";
import { sincronizarPersonasMesa, getOperacionesConItems } from "../services/operacionesService";
import { obtenerDatosCajaExterna } from "../services/cajaExternaService";
import { message } from "antd";
import { supabase } from "../lib/supabase";

export interface MesaCaja {
  mesa: number;
  personas: number;
}

interface AppState {
  mozos: Mozo[];
  bebidas: Bebida[];
  jornadaActiva: Jornada | null;
  jornadaSeleccionada: Jornada | null; // <-- La que se visualiza en "Despacho"
  operacionesActivas: Operacion[];
  itemsOperaciones: ItemOperacion[];
  mesasCaja: MesaCaja[];
  usuario: any | null;

  // Acciones (Setters)
  setUsuario: (user: any) => void;
  inicializarAuth: () => void;
  setMozos: (mozos: Mozo[]) => void;
  setBebidas: (bebidas: Bebida[]) => void;
  setJornadaActiva: (jornada: Jornada | null) => void;
  setJornadaSeleccionada: (jornada: Jornada | null) => void;
  setOperacionesActivas: (operaciones: Operacion[]) => void;
  setItemsOperaciones: (items: ItemOperacion[]) => void;
  fetchMesasCaja: () => Promise<void>;
  verificarCambiosDeCaja: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  mozos: [],
  bebidas: [],
  jornadaActiva: null,
  jornadaSeleccionada: null,
  operacionesActivas: [],
  itemsOperaciones: [],
  mesasCaja: [],
  usuario: null,

  setUsuario: (user) => set({ usuario: user }),
  inicializarAuth: () => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ usuario: session?.user ?? null });
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ usuario: session?.user ?? null });
    });
  },

  setMozos: (mozos) => set({ mozos }),
  setBebidas: (bebidas) => set({ bebidas }),
  setJornadaActiva: (jornadaActiva) => set({ jornadaActiva }),
  setJornadaSeleccionada: (jornadaSeleccionada) => set({ jornadaSeleccionada }),
  setOperacionesActivas: (operacionesActivas) => set({ operacionesActivas }),
  setItemsOperaciones: (itemsOperaciones) => set({ itemsOperaciones }),

  fetchMesasCaja: async () => {
    const { jornadaSeleccionada } = get();
    const url = jornadaSeleccionada?.url_caja_sheets;

    if (!url) {
      set({ mesasCaja: [] });
      return;
    }

    const datos = await obtenerDatosCajaExterna(url);
    set({ mesasCaja: datos });
  },

  verificarCambiosDeCaja: async () => {
    const { mesasCaja, operacionesActivas, jornadaSeleccionada, setOperacionesActivas } = get();
    if (!jornadaSeleccionada || operacionesActivas.length === 0 || mesasCaja.length === 0) return;

    let huboCambios = false;

    for (const op of operacionesActivas) {
      if (op.estado === "Abierta") {
        const cajaData = mesasCaja.find((m) => m.mesa === op.numero_mesa);
        
        // Si la mesa existe en caja y la cantidad de personas difiere
        if (cajaData && cajaData.personas !== op.cantidad_personas) {
          try {
            await sincronizarPersonasMesa(op.id, cajaData.personas);
            huboCambios = true;
            // Usamos message de Ant Design para notificar a la despachante
            message.warning(`La Mesa ${op.numero_mesa} se actualizó a ${cajaData.personas} personas. Se reiniciaron las bonificaciones.`);
          } catch (error) {
            console.error(`Error sincronizando mesa ${op.numero_mesa}:`, error);
          }
        }
      }
    }

    // Si actualizamos algo en BD, refrescamos el mapa global
    if (huboCambios) {
      const dataRefrescada = await getOperacionesConItems(jornadaSeleccionada.id);
      setOperacionesActivas(dataRefrescada as any);
    }
  },
}));
