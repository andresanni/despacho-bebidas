import { Drawer, Typography, Row, Col, Statistic, Table, Divider, Button, Modal, message } from "antd";
import {
  DollarOutlined,
  CreditCardOutlined,
  QrcodeOutlined,
  ReconciliationOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { useAppStore } from "../store/useAppStore";
import { cerrarJornadaDb } from "../services/operacionesService";
import { generarExcelCierre } from "../utils/exportadorExcel";

const { Title } = Typography;

interface ArqueoDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export function ArqueoDrawer({ visible, onClose }: ArqueoDrawerProps) {
  const operacionesActivas = useAppStore((state) => state.operacionesActivas);
  const mozos = useAppStore((state) => state.mozos);
  const bebidas = useAppStore((state) => state.bebidas);
  const jornadaSeleccionada = useAppStore((state) => state.jornadaSeleccionada);

  const esModoMuseo = jornadaSeleccionada?.estado === "cerrada";

  const handleCerrarJornada = () => {
    const mesasPendientes = operacionesActivas.some(op => op.estado === "Abierta");
    if (mesasPendientes) {
      message.warning("Aún hay mesas abiertas. Por favor, cóbralas o anúlalas antes de cerrar.");
      return;
    }

    Modal.confirm({
      title: "¿Estás seguro de cerrar la jornada?",
      content: "Esto generará el reporte Excel de cierre y bloqueará la carga de nuevas comandas (Modo Histórico).",
      okText: "Sí, Cerrar Jornada",
      okType: "danger",
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          if (!jornadaSeleccionada) return;
          generarExcelCierre(operacionesActivas, bebidas, mozos, jornadaSeleccionada.fecha);
          await cerrarJornadaDb(jornadaSeleccionada.id);
          useAppStore.setState({ 
            jornadaSeleccionada: { ...jornadaSeleccionada, estado: "cerrada" } 
          });
          message.success("Jornada cerrada y reporte descargado con éxito.");
          onClose();
        } catch (error: any) {
          message.error("Error al cerrar la jornada: " + error.message);
        }
      }
    });
  };

  // --- Sección Finanzas ---
  const operacionesPagadas = operacionesActivas.filter(
    (op) => op.estado === "Pagada",
  );

  const totalRecaudado = operacionesPagadas.reduce(
    (acc, op) => acc + (op.total_neto || 0),
    0,
  );

  const totalEfectivo = operacionesPagadas
    .filter((op) => op.metodo_pago === "Efectivo")
    .reduce((acc, op) => acc + (op.total_neto || 0), 0);

  const totalDebito = operacionesPagadas
    .filter((op) => op.metodo_pago === "Debito")
    .reduce((acc, op) => acc + (op.total_neto || 0), 0);

  const totalQR = operacionesPagadas
    .filter((op) => op.metodo_pago === "QR")
    .reduce((acc, op) => acc + (op.total_neto || 0), 0);

  // --- Sección Rendimiento ---
  // 1. Pre-agrupamiento global de operaciones por sesión de mesa
  const sesionesAgrupadas = Object.values(
    operacionesActivas.reduce((acc: any, op: any) => {
      const key = `${op.numero_mesa}-${op.mozo_id}-${op.mozo_id_2 || 'solo'}`;
      if (!acc[key]) {
        acc[key] = {
          numero_mesa: op.numero_mesa,
          mozo_id: op.mozo_id,
          mozo_id_2: op.mozo_id_2,
          max_personas: op.cantidad_personas || 0,
          activa: op.estado === "Abierta",
        };
      } else {
        // En una misma sesión, siempre usamos el máximo de personas registrado
        acc[key].max_personas = Math.max(acc[key].max_personas, op.cantidad_personas || 0);
        // Si al menos una operación de la sesión está abierta, se cuenta como activa
        if (op.estado === "Abierta") acc[key].activa = true;
      }
      return acc;
    }, {})
  );

  const estadisticasMozos = mozos.map((mozo) => {
    let mesasTotales = 0;
    let cubiertosTotales = 0;
    let mesasActivas = 0;
    let cubiertosActivos = 0;

    sesionesAgrupadas.forEach((sesion: any) => {
      if (sesion.mozo_id !== mozo.id && sesion.mozo_id_2 !== mozo.id) return;

      const personasTotales = sesion.max_personas;
      let cubiertosParaMozo = 0;

      if (sesion.mozo_id_2) { // mesa compartida
        if (sesion.mozo_id === mozo.id) {
          cubiertosParaMozo = Math.ceil(personasTotales / 2);
        } else if (sesion.mozo_id_2 === mozo.id) {
          cubiertosParaMozo = Math.floor(personasTotales / 2);
        }
      } else { // mesa de 1 mozo
        cubiertosParaMozo = personasTotales;
      }

      mesasTotales += 1;
      cubiertosTotales += cubiertosParaMozo;

      if (sesion.activa) {
        mesasActivas += 1;
        cubiertosActivos += cubiertosParaMozo;
      }
    });

    return {
      key: mozo.id,
      nombre: mozo.nombre,
      mesasTotales,
      cubiertosTotales,
      mesasActivas,
      cubiertosActivos,
    };
  });

  const baseColumn = {
    title: "Mozo",
    dataIndex: "nombre",
    key: "nombre",
    sorter: (a: any, b: any) => a.nombre.localeCompare(b.nombre),
  };

  const columnasTotal = [
    {
      title: "MESAS",
      dataIndex: "mesasTotales",
      key: "mesasTotales",
      align: "center" as const,
      sorter: (a: any, b: any) => a.mesasTotales - b.mesasTotales,
    },
    {
      title: "CUBIERTOS",
      dataIndex: "cubiertosTotales",
      key: "cubiertosTotales",
      align: "center" as const,
      sorter: (a: any, b: any) => a.cubiertosTotales - b.cubiertosTotales,
    },
  ];

  const columns: any[] = [baseColumn];

  if (!esModoMuseo) {
    const activeColorCell = "#0f172a"; // Slate 900 - Muy sutil, casi integrado al fondo
    const activeColorHeader = "#1e293b"; // Slate 800 - Un poco más de cuerpo para el encabezado

    columns.push(
      {
        title: "ACTIVAS",
        onHeaderCell: () => ({ style: { backgroundColor: activeColorHeader } }),
        children: [
          {
            title: "MESAS",
            dataIndex: "mesasActivas",
            key: "mesasActivas",
            align: "center" as const,
            sorter: (a: any, b: any) => a.mesasActivas - b.mesasActivas,
            onCell: () => ({ style: { backgroundColor: activeColorCell } }),
            onHeaderCell: () => ({ style: { backgroundColor: activeColorHeader } }),
          },
          {
            title: "CUBIERTOS",
            dataIndex: "cubiertosActivos",
            key: "cubiertosActivos",
            align: "center" as const,
            sorter: (a: any, b: any) => a.cubiertosActivos - b.cubiertosActivos,
            onCell: () => ({ style: { backgroundColor: activeColorCell } }),
            onHeaderCell: () => ({ style: { backgroundColor: activeColorHeader } }),
          },
        ],
      },
      {
        title: "TOTAL",
        children: columnasTotal,
      }
    );
  } else {
    columns.push(...columnasTotal);
  }

  return (
    <Drawer
      title="Resumen de Caja y Rendimiento"
      placement="right"
      width={700}
      onClose={onClose}
      open={visible}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button key="cancel" onClick={onClose}>
            Cerrar
          </Button>
          {jornadaSeleccionada?.estado === 'abierta' && (
            <Button key="cerrarJornada" type="primary" danger onClick={handleCerrarJornada}>
              Cerrar Jornada y Descargar Excel
            </Button>
          )}
          {jornadaSeleccionada?.estado === 'cerrada' && (
            <Button 
              key="descargarExcel" 
              type="primary" 
              icon={<DownloadOutlined />} 
              onClick={() => {
                generarExcelCierre(operacionesActivas, bebidas, mozos, jornadaSeleccionada.fecha);
                message.success("Reporte histórico descargado.");
              }}
            >
              Descargar Excel Histórico
            </Button>
          )}
        </div>
      }
    >
      <Title level={4}>Flujo de Caja {esModoMuseo ? "(Cerrado)" : "(Abierto)"}</Title>
      <Row gutter={[16, 16]} style={{ marginBottom: "2rem" }}>
        <Col span={24}>
          <Statistic
            title="Recaudación Bruta Final"
            value={totalRecaudado}
            formatter={(val) => `$${Number(val).toLocaleString("es-AR")}`}
            valueStyle={{ color: "#0891b2", fontSize: "2rem" }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Efectivo"
            value={totalEfectivo}
            formatter={(val) => <><DollarOutlined /> ${Number(val).toLocaleString("es-AR")}</>}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Débito"
            value={totalDebito}
            formatter={(val) => <><CreditCardOutlined /> ${Number(val).toLocaleString("es-AR")}</>}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="MercadoPago / QR"
            value={totalQR}
            formatter={(val) => <><QrcodeOutlined /> ${Number(val).toLocaleString("es-AR")}</>}
          />
        </Col>
      </Row>

      <Divider />

      <Title level={4}>
        <ReconciliationOutlined style={{ marginRight: 8 }} />
        Rendimiento del Personal
      </Title>

      <Table
        columns={columns}
        dataSource={estadisticasMozos.filter((em) => em.mesasTotales > 0)}
        pagination={false}
        size="small"
        bordered
      />
    </Drawer>
  );
}
