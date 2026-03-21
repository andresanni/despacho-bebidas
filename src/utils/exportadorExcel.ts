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
  const mozosMap = new Map();
  operaciones.forEach(op => { // Aquí contamos todas las mesas atendidas, incluso si hubo descuentos totales
    const nombreMozo = mozos.find(m => m.id === op.mozo_id)?.nombre || 'Desconocido';
    if (!mozosMap.has(nombreMozo)) {
      mozosMap.set(nombreMozo, { Mozo: nombreMozo, 'Mesas Atendidas': 0, 'Total Personas': 0 });
    }
    mozosMap.get(nombreMozo)['Mesas Atendidas'] += 1;
    mozosMap.get(nombreMozo)['Total Personas'] += (op.cantidad_personas || 0);
  });
  const dataMozos = Array.from(mozosMap.values());

  // --- GENERACIÓN DEL LIBRO EXCEL ---
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dataProductos), "Productos");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dataCaja), "Caja");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dataMozos), "Mozos");

  XLSX.writeFile(wb, `Cierre_Jornada_${fechaJornada}.xlsx`);
}
