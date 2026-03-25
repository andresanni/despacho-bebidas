export type EstadoJornada = "abierta" | "cerrada";
export type EstadoOperacion = "Abierta" | "Ticket Impreso" | "Pagada";
export type MetodoPago = "Efectivo" | "QR" | "Debito" | "Bonificación 100%" | "Incobrable" | null;

export interface Jornada {
  id: string; // uuid
  fecha: string; // date (YYYY-MM-DD)
  estado: EstadoJornada; // default 'abierta'
  url_caja_sheets?: string | null;
  creado_en: string; // timestamptz
}

export interface Mozo {
  id: string; // uuid
  nombre: string;
  activo?: boolean; // default true
}

export interface Bebida {
  id: string; // uuid
  nombre: string;
  precio_actual: number; // numeric(10, 2)
  activo?: boolean; // default true
}

export interface Operacion {
  id: string; // uuid
  jornada_id: string; // uuid (referencia a Jornada)
  numero_mesa: number;
  mozo_id: string | null; // uuid (referencia a Mozo)
  cantidad_personas: number | null;
  estado: EstadoOperacion; // default 'Abierta'
  metodo_pago: MetodoPago;
  total_neto?: number;
  creado_en: string; // timestamptz
  items_operacion?: ItemOperacion[];
}

export interface ItemOperacion {
  id: string; // uuid
  operacion_id: string; // uuid (referencia a Operacion, on delete cascade)
  bebida_id: string; // uuid (referencia a Bebida)
  cantidad: number; // default 1
  precio_unitario: number; // numeric(10, 2)
  cantidad_bonificada_100: number;
  cantidad_bonificada_50: number;
  creado_en: string; // timestamptz
}
