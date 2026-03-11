import { create } from "zustand";
import type { Mozo, Bebida, Jornada, Operacion, ItemOperacion } from "../types";

interface AppState {
  mozos: Mozo[];
  bebidas: Bebida[];
  jornadaActiva: Jornada | null;
  jornadaSeleccionada: Jornada | null; // <-- La que se visualiza en "Despacho"
  operacionesActivas: Operacion[];
  itemsOperaciones: ItemOperacion[];

  // Acciones (Setters)
  setMozos: (mozos: Mozo[]) => void;
  setBebidas: (bebidas: Bebida[]) => void;
  setJornadaActiva: (jornada: Jornada | null) => void;
  setJornadaSeleccionada: (jornada: Jornada | null) => void;
  setOperacionesActivas: (operaciones: Operacion[]) => void;
  setItemsOperaciones: (items: ItemOperacion[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  mozos: [],
  bebidas: [],
  jornadaActiva: null,
  jornadaSeleccionada: null,
  operacionesActivas: [],
  itemsOperaciones: [],

  setMozos: (mozos) => set({ mozos }),
  setBebidas: (bebidas) => set({ bebidas }),
  setJornadaActiva: (jornadaActiva) => set({ jornadaActiva }),
  setJornadaSeleccionada: (jornadaSeleccionada) => set({ jornadaSeleccionada }),
  setOperacionesActivas: (operacionesActivas) => set({ operacionesActivas }),
  setItemsOperaciones: (itemsOperaciones) => set({ itemsOperaciones }),
}));
