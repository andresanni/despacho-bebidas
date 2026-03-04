-- 1. Tablas Base
CREATE TABLE jornadas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    estado TEXT CHECK (estado IN ('abierta', 'cerrada')) DEFAULT 'abierta',
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE mozos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre TEXT NOT NULL,
    activo BOOLEAN DEFAULT true
);

CREATE TABLE bebidas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre TEXT NOT NULL,
    precio_actual NUMERIC(10, 2) NOT NULL,
    activa BOOLEAN DEFAULT true
);

-- 2. Tablas Transaccionales
CREATE TABLE operaciones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    jornada_id UUID REFERENCES jornadas(id) NOT NULL,
    numero_mesa INTEGER NOT NULL,
    mozo_id UUID REFERENCES mozos(id),
    estado TEXT CHECK (estado IN ('Abierta', 'Ticket Impreso', 'Pagada')) DEFAULT 'Abierta',
    metodo_pago TEXT CHECK (metodo_pago IN ('Efectivo', 'QR', 'Debito', NULL)),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(jornada_id, numero_mesa) -- El candado para no repetir mesa en el mismo día
);

CREATE TABLE items_operacion (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    operacion_id UUID REFERENCES operaciones(id) ON DELETE CASCADE NOT NULL,
    bebida_id UUID REFERENCES bebidas(id) NOT NULL,
    cantidad INTEGER NOT NULL DEFAULT 1,
    precio_unitario NUMERIC(10, 2) NOT NULL,
    porcentaje_bonificacion INTEGER CHECK (porcentaje_bonificacion IN (0, 50, 100)) DEFAULT 0,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);