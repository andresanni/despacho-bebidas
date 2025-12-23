// Enums que reflejan los tipos custom de Postgres
export type EstadoJornada = 'ABIERTA' | 'CERRADA';
export type EstadoOperacion = 'NO_ASIGNADA' | 'ABIERTA' | 'TICKET_IMPRESO' | 'PAGA';

// ========== Tablas ==========

export interface Jornada {
  idJornada: number; 
  fecha: string; 
  estado: EstadoJornada;
  notas?: string | null;
}

export interface Mozo {
  idMozo: number;
  nombre: string;
  activo: boolean;
}

export interface Mesa {
  idMesa: number;
  numero: string;
  capacidad: number;
  ubicacion?: string | null;
  activo: boolean;
}

export interface Bebida {
  idBebida: number;
  nombre: string;
  precio: number; 
  categoria?: string | null;
  activo: boolean;
}

export interface Operacion {
  idOperacion: number;
  idJornada: number;
  idMesa: number;
  idMozo?: number | null;
  estado: EstadoOperacion;
  fechaApertura: string; 
  fechaCierre?: string | null;
  total?: number | null;
}

export interface ItemOperacion {
  idItemOperacion: number;
  idOperacion: number;
  idBebida: number;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}
