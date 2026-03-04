import { create } from "zustand";
import type { Mozo, Bebida, Jornada, Operacion, ItemOperacion } from "../types";

interface AppState {
  mozos: Mozo[];
  bebidas: Bebida[];
  jornadaActual: Jornada | null;
  operacionesActivas: Operacion[];
  itemsOperaciones: ItemOperacion[];

  // Acciones (Setters)
  setMozos: (mozos: Mozo[]) => void;
  setBebidas: (bebidas: Bebida[]) => void;
  setJornadaActual: (jornada: Jornada | null) => void;
  setOperacionesActivas: (operaciones: Operacion[]) => void;
  setItemsOperaciones: (items: ItemOperacion[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  mozos: [],
  bebidas: [],
  jornadaActual: null,
  operacionesActivas: [],
  itemsOperaciones: [],

  setMozos: (mozos) => set({ mozos }),
  setBebidas: (bebidas) => set({ bebidas }),
  setJornadaActual: (jornadaActual) => set({ jornadaActual }),
  setOperacionesActivas: (operacionesActivas) => set({ operacionesActivas }),
  setItemsOperaciones: (itemsOperaciones) => set({ itemsOperaciones }),
}));
