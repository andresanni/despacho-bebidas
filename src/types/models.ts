import type { CreateEntity, UpdateEntity } from "./crud";

// Enums que reflejan los tipos custom de Postgres
export type EstadoJornada = 'ABIERTA' | 'CERRADA';
export type EstadoOperacion = 'NO_ASIGNADA' | 'ABIERTA' | 'TICKET_IMPRESO' | 'PAGA';

// Tablas 
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

// ========== Tipos CRUD derivados ==========

// Jornada
export type JornadaCreate = CreateEntity<Jornada, 'idJornada'>;
export type JornadaUpdate = UpdateEntity<Jornada, 'idJornada'>;

// Mozo
export type MozoCreate = CreateEntity<Mozo, 'idMozo'>;
export type MozoUpdate = UpdateEntity<Mozo, 'idMozo'>;

// Mesa
export type MesaCreate = CreateEntity<Mesa, 'idMesa'>;
export type MesaUpdate = UpdateEntity<Mesa, 'idMesa'>;

// Bebida
export type BebidaCreate = CreateEntity<Bebida, 'idBebida'>;
export type BebidaUpdate = UpdateEntity<Bebida, 'idBebida'>;