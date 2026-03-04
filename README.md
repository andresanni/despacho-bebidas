# Sistema de Despacho de Bebidas

Este proyecto es una aplicacion web para la gestion de despacho de bebidas en un entorno gastronomico. Permite el control de mesas, registro de comandas y gestion de cierres de jornada.

## Funcionalidades principales

- Gestion de mesas activas y su estado (Abierta, Pagada).
- Registro de consumos (bebidas) vinculados a mozos especificos.
- Sistema de bonificaciones por comensal (creditos).
- Generacion e impresion de tickets de consumo.
- Control de apertura y cierre de jornadas de trabajo.

## Tecnologias utilizadas

- React 19
- TypeScript
- Vite
- Ant Design (Interfaz de usuario)
- Supabase (Base de datos y autenticacion)
- Zustand (Gestion de estado)
- React-to-print (Impresion de tickets)

## Configuracion del entorno

Para ejecutar el proyecto localmente, es necesario configurar las siguientes variables de entorno en un archivo .env:

VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase

## Instalacion y ejecucion

1. Instalacion de dependencias:
   npm install

2. Ejecucion en entorno de desarrollo:
   npm run dev

3. Construccion para produccion:
   npm run build
