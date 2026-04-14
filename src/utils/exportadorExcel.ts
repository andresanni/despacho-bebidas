import * as XLSX from 'xlsx';

export function generarExcelCierre(operaciones: any[], bebidas: any[], mozos: any[], fechaJornada: string) {
  // Filtramos solo las operaciones cobradas para la contabilidad
  const operacionesPagadas = operaciones.filter(op => op.estado === 'Pagada');

  // --- REPORTE 1: PRODUCTOS ---
  const productosMap = new Map();
  operacionesPagadas.forEach(op => {
    op.items_operacion?.forEach((item: any) => {
      const nombreBebida = bebidas.find(b => b.id === item.bebida_id)?.nombre || 'Desconocida';
      if (!productosMap.has(nombreBebida)) {
        productosMap.set(nombreBebida, { Producto: nombreBebida, Cantidad: 0 });
      }
      productosMap.get(nombreBebida).Cantidad += item.cantidad;
    });
  });
  const dataProductos = Array.from(productosMap.values()).sort((a, b) => b.Cantidad - a.Cantidad);

  // --- REPORTE 2: CAJA ---
  const cajaMap = new Map();
  operacionesPagadas.forEach(op => {
    const metodo = op.metodo_pago || 'No Especificado';
    if (!cajaMap.has(metodo)) {
      cajaMap.set(metodo, { 'Método de Pago': metodo, Recaudación: 0 });
    }
    // Recordatorio: la base de datos guarda el valor cobrado en "total_neto"
    cajaMap.get(metodo).Recaudación += Number(op.total_neto || 0);
  });
  const dataCaja = Array.from(cajaMap.values());

  // --- REPORTE 3: MOZOS ---
  // 1. Pre-agrupamiento global de operaciones por sesión de mesa
  const sesionesAgrupadas = Object.values(
    operaciones.reduce((acc: any, op: any) => {
      const key = `${op.numero_mesa}-${op.mozo_id}-${op.mozo_id_2 || 'solo'}`;
      if (!acc[key]) {
        acc[key] = {
          numero_mesa: op.numero_mesa,
          mozo_id: op.mozo_id,
          mozo_id_2: op.mozo_id_2,
          max_personas: op.cantidad_personas || 0,
        };
      } else {
        acc[key].max_personas = Math.max(acc[key].max_personas, op.cantidad_personas || 0);
      }
      return acc;
    }, {})
  );

  const mozosMap = new Map();
  sesionesAgrupadas.forEach((sesion: any) => {
    const totalPersonas = sesion.max_personas;
    const mozo1Id = sesion.mozo_id;
    const mozo2Id = sesion.mozo_id_2;

    if (mozo2Id) {
      const nombreMozo1 = mozos.find(m => m.id === mozo1Id)?.nombre || 'Desconocido 1';
      const nombreMozo2 = mozos.find(m => m.id === mozo2Id)?.nombre || 'Desconocido 2';
      
      const p1 = Math.ceil(totalPersonas / 2);
      const p2 = Math.floor(totalPersonas / 2);

      if (!mozosMap.has(nombreMozo1)) {
        mozosMap.set(nombreMozo1, { Mozo: nombreMozo1, 'Mesas Atendidas': 0, 'Total Personas': 0 });
      }
      if (!mozosMap.has(nombreMozo2)) {
        mozosMap.set(nombreMozo2, { Mozo: nombreMozo2, 'Mesas Atendidas': 0, 'Total Personas': 0 });
      }

      mozosMap.get(nombreMozo1)['Mesas Atendidas'] += 1;
      mozosMap.get(nombreMozo1)['Total Personas'] += p1;

      mozosMap.get(nombreMozo2)['Mesas Atendidas'] += 1;
      mozosMap.get(nombreMozo2)['Total Personas'] += p2;
    } else {
      const nombreMozo = mozos.find(m => m.id === mozo1Id)?.nombre || 'Desconocido';
      if (!mozosMap.has(nombreMozo)) {
        mozosMap.set(nombreMozo, { Mozo: nombreMozo, 'Mesas Atendidas': 0, 'Total Personas': 0 });
      }
      mozosMap.get(nombreMozo)['Mesas Atendidas'] += 1;
      mozosMap.get(nombreMozo)['Total Personas'] += totalPersonas;
    }
  });
  const dataMozos = Array.from(mozosMap.values());

  // --- GENERACIÓN DEL LIBRO EXCEL ---
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dataProductos), "Productos");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dataCaja), "Caja");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dataMozos), "Mozos");

  XLSX.writeFile(wb, `Cierre_Jornada_${fechaJornada}.xlsx`);
}
