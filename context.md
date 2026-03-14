# Contexto del Proyecto: Sistema de Despacho Gastronómico (POS & ERP)

## 1. Visión General
Este es un sistema integral de Punto de Venta (POS) y Gestión Operativa para un bar/restaurante, diseñado para ser operado por la "Despachante" (cajera/controladora). 
**Prioridad Absoluta:** Integridad de los datos, inmutabilidad histórica y velocidad operativa.

## 2. Stack Tecnológico & Arquitectura
* **Frontend:** React 19, TypeScript, Vite.
* **UI/UX:** Ant Design v6 (Tema Oscuro por defecto, color primario naranja `#d97706`).
* **Estado Global:** Zustand (`useAppStore` centralizado).
* **Base de Datos / Backend:** Supabase (PostgreSQL) con acceso mediante `supabase-js`.
* **Enrutamiento:** React Router DOM v6 (Arquitectura "App Shell", Layout Anclado).
* **Impresión:** `react-to-print` para emitir tickets físicos de manera nativa sin recargar.

## 3. Modelo de Dominio y Entidades Principales
* **Jornadas (`Jornada`):** Representan un día o turno de trabajo continuo. Tienen estado `abierta` o `cerrada` y sirven como eje temporal para todo el resto de las operaciones de la app.
* **Mozos (`Mozo`):** Personal que atiende. Se identifican unívocamente por UUIDs y poseen campos para baja lógica (Soft Delete).
* **Catálogo (`Bebida`):** Productos vendibles. Poseen un precio que es variable a futuro pero inmutable en relación a pasados gracias a que cada ticket saca una "foto".
* **Operaciones (`Operacion`):** Equivalente conceptual a un "Ticket", una "Transacción" o una "Mesa Abierta". Tienen `numero_mesa`, `cantidad_personas`, `estado` ('Abierta', 'Ticket Impreso', 'Pagada'), y el metadato del `metodo_pago` y quien lo atendió (`mozo_id`).
* **Consumos (`ItemOperacion`):** Mapeo N:M en consumos que asocian las Bebidas a las Operaciones. Guarda las combinaciones de bonificadas al 100%, 50% y los precios guardados "en el momento".

## 4. Reglas de Negocio Estrictas

### A. Mesas vs. Operaciones
* En este sistema, la palabra **"Mesa" no representa un mueble de madera físico, sino un "Ticket" o "Transacción"**.
* Si la "Mesa 11" paga su cuenta y luego pide un café, se le abre una **nueva** tarjeta verde "Mesa 11" (nueva operación). La base de datos permite infinitas "Mesas 11" por jornada (El Constraint de unicidad que ligaba 1 jornada = 1 mesa única fue eliminado intencionalmente).
* **Cubiertos (Personas):** Es la cantidad de personas sentadas (en la UI a veces dice "personas" o "comensales", pero en los reportes se usa "Cubiertos" o volúmenes como "Cubiertos Totales").

### B. El Mecanismo de Bonificaciones (Créditos)
* Las bonificaciones se calculan estrictamente en base a los Cubiertos (Cantidad de Personas). 
* **Fórmula base algorítmica:** 1 Persona (Cubierto) = 1 Medio Crédito (se muestra dividido por 2 en UI por UX, es decir, un entero representa 2 medios).
* Un producto bonificado al 100% consume **2** medios créditos.
* Un producto bonificado al 50% consume **1** medio crédito.
* El sistema bloquea al usuario si intenta exceder sus créditos de descuento disponibles en `CuentaModal`. 
* **Seguridad y Recálculo:** Si se cambian las cantidades de bebidas en una cuenta o la cantidad de comensales sentados, **las bonificaciones de todas las cervezas de ese ticket se reinician a 0 de forma automática** como medida de seguridad, forzando a la despachante a volver a asignarlas sin errores matemáticos.

### C. Jornadas y El "Modo Museo"
* Existen dos punteros de estado paralelos y desacoplados en el `useAppStore` de Zustand:
  * `jornadaActiva`: La jornada real o verdadera que está corriendo "hoy" (estado 'abierta' base).
  * `jornadaSeleccionada`: La jornada que el usuario **decidió visualizar en pantalla** (puede ser del pasado).
* **Modo Museo:** Si se selecciona una fecha histórica (`jornadaSeleccionada.estado === 'cerrada'`), toda la UI operativa se "congela". El formulario de comandas desaparece por completo (Return null preventivo), los input-numbers se transforman en Typography text puro, desaparecen botones de guardar o anular, y solo "sobrevive" el botón de "Imprimir Ticket" (Porque puede hacer falta una copia de un comprobante antiguo). Es la protección por "Foto Inmutable".
* **Regla de Cierre de Jornada (Guillotina):** No se puede cerrar una jornada y declararla histórica si existe al menos una operación en estado 'Abierta'. Hay que cobrarla, o bien, si sobró sin uso, anularla (soft-deleteando/hard-deleteando sus dependencias en cascada).

### D. Inmutabilidad, Soft Delete y Fotos Financieras
* **Baja Lógica (Soft Delete de metadatos):** **La Regla de Oro**. NUNCA se hace un `DELETE` en la base de datos para productos del catálogo ni personal (mozos). En su lugar, se utiliza un booleano semántico `activo: false`.
* **Impacto Visual:** Si una bebida o mozo se "pausa" (su boolean es false), estos desaparecen automáticamente de los `Select` del formulario de nueva comanda (no se pueden seleccionar hoy), pero los tickets del año 2025 o cualquier cálculo de "Arqueos Históricos" los seguirán mostrando, renderizando e iterando a la perfección dado que los UUIDs no desaparecen de las BD (Evita la rotura de Foreign Keys en la tabla `operaciones`).
* **Fotos Financieras (Congelamiento de Precios):** Los comprobantes guardan el precio en `precio_unitario` por cada bebida `ItemOperacion` servida **al momento en el que se sirvió**. Además, el calculo final consolidado que involucra bonificaciones, se guarda como foto plana y estática (`total_neto`) junto con su `metodo_pago` cuando la mesa cambia al estado "Pagada". 
* **Anulación Causal de Mesas:** Aquellas mesas en estado 'Abierta' que por remoción de ítems en el modal de cobro llegan a quedar **con importe de 0 consumos** son automáticamente eliminadas por trigger en Frontend de `CuentaModal` para no dejar basura suelta en la UI. También se puede hacer una anulación explícita con botón rojo por equivocación, que vacía los items por cascada.

### E. Arqueo de Caja (Drawer Desplegable X vs Z)
* Existe un `ArqueoDrawer` lateral principal que condensa toda la información financiera y el rendimiento individual del personal.
* **Arqueo X (Tiro Falso / En vivo):** Mide el rendimiento real intra-jornada. Muestra todo el total facturado sumando los QR/Efectivo/Red hasta las 20hs, y lista a los mozos indicando Mesas/Cubiertos "Activos" (la gente sentada charlando en este instante) vs los "Totales". Los encabezados de tabla de Mozo y métricas son **ordenables iterativamente**.
* **Arqueo Z (Foto del Cierre / Histórico):** Aterrizaje del modo Museo. Entiende que un día histórico ya "cerró sus puertas" en el pasado real, por lo que oculta y destruye de la UI las columnas analíticas de métricas "Activas" (estaría de más llenar de "0"s o "Vacíos" si ya no hay nadie sentado). Solo preserva al público los resultados de la métrica y facturaciones definitivos consolidados.

## 5. Patrones de UI/UX y Resoluciones de Layout
* **Layout Anclado y Flexbox Blowout ("No-Scroll Principal"):** La aplicación principal, por política y comodidad táctil, **NUNCA hace scroll global** en el `window` o `body`. Ante subida drástica en longitud de elementos hijos flex, solucionamos el bug de "Flexbox Blowout" aplicando fuertemente restricciones de contenedor como `minHeight: 0` y `overflow: hidden` a lo largo de todos los layout wrappers intermedios desde el `<Layout/>` base hasta la `<main>` div.
* **Scroll Independiente en Columnas:** Cada área de batalla (Formulario de Nueva Comanda a la Izquierda para Desktop, y Mapa Visual de Tarjetas a la Derecha) hace scroll a su propio ritmo con `overflowY: 'auto'`. La barra vertical no sube o baja los banners globales ni navega fuera de componentes no scrollables.
* **Scrollbar Gutter Estricto (No-Shift):** Se utiliza activamente `scrollbarGutter: 'stable'` en los grids principales (ej: Mapa de Mesas contenedor). Esto es crucial en esta app particular porque la repentina aparición de una barra de scroll lateral al abrir una "quinta/décima" mesa producía un 'jerk' (Layout Shift). Con esto aseguramos simetría permanente de las cards en la cuadrícula.
* **Ordenamiento Numérico:** Las tarjetas veres correspondientes a mesas en el mapa SIEMPRE se fuerzan por código para que salgan ordenadas orgánicamente por número (`a.numero_mesa - b.numero_mesa`) de forma ascendente estricta, prescindiendo del orden de inserción temporal en el array al iterarlo en el renderizado, logrando previsibilidad para la despachante de un impacto visual.
* **Separación de Responsabilidad Reactiva:** El componente `CuentaModal.tsx` tiene un nivel altísimo de lógica de recálculo optimista y validación (cambios locales en memoria de array de items `itemsEditable` y de un diccionario clave:valor `bonificaciones{}`). Solo tras validación de "Suficientes Créditos Disp." y dar click de confirmación de intención, dispara un servicio de escritura directa a `supabase.from('items_operacion').upsert`. Y al emitir el "print" abre silenciosamente un render oculto (`Display: none`) con márgenes CSS especiales destinados a las ticketeras comandita de la caja real, todo sin entorpecer la vista de UI ni recargar.