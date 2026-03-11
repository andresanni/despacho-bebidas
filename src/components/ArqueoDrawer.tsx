import { Drawer, Typography, Row, Col, Statistic, Table, Divider } from "antd";
import {
  DollarOutlined,
  CreditCardOutlined,
  QrcodeOutlined,
  ReconciliationOutlined,
} from "@ant-design/icons";
import { useAppStore } from "../store/useAppStore";

const { Title } = Typography;

interface ArqueoDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export function ArqueoDrawer({ visible, onClose }: ArqueoDrawerProps) {
  const operacionesActivas = useAppStore((state) => state.operacionesActivas);
  const mozos = useAppStore((state) => state.mozos);
  const jornadaSeleccionada = useAppStore((state) => state.jornadaSeleccionada);

  const esModoMuseo = jornadaSeleccionada?.estado === "cerrada";

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
  const estadisticasMozos = mozos.map((mozo) => {
    const opsMozo = operacionesActivas.filter((op) => op.mozo_id === mozo.id);
    const opsActivas = opsMozo.filter((op) => op.estado === "Abierta");

    const mesasTotales = opsMozo.length;
    const cubiertosTotales = opsMozo.reduce(
      (acc, op) => acc + (op.cantidad_personas || 1),
      0,
    );

    const mesasActivas = opsActivas.length;
    const cubiertosActivos = opsActivas.reduce(
      (acc, op) => acc + (op.cantidad_personas || 1),
      0,
    );

    return {
      key: mozo.id,
      nombre: mozo.nombre,
      mesasTotales,
      cubiertosTotales,
      mesasActivas,
      cubiertosActivos,
    };
  });

  const columns = [
    {
      title: "Mozo",
      dataIndex: "nombre",
      key: "nombre",
      sorter: (a: any, b: any) => a.nombre.localeCompare(b.nombre),
    },
    {
      title: "Mesas Atendidas",
      dataIndex: "mesasTotales",
      key: "mesasTotales",
      align: "center" as const,
      sorter: (a: any, b: any) => a.mesasTotales - b.mesasTotales,
    },
    {
      title: "Cubiertos (Total)",
      dataIndex: "cubiertosTotales",
      key: "cubiertosTotales",
      align: "center" as const,
      sorter: (a: any, b: any) => a.cubiertosTotales - b.cubiertosTotales,
    },
  ];

  // Si NO es modo museo, agregamos las columnas de lo "Actualmente abierto"
  if (!esModoMuseo) {
    columns.push(
      {
        title: "Mesas Activas",
        dataIndex: "mesasActivas",
        key: "mesasActivas",
        align: "center" as const,
        sorter: (a: any, b: any) => a.mesasActivas - b.mesasActivas,
      },
      {
        title: "Cubiertos Activos",
        dataIndex: "cubiertosActivos",
        key: "cubiertosActivos",
        align: "center" as const,
        sorter: (a: any, b: any) => a.cubiertosActivos - b.cubiertosActivos,
      },
    );
  }

  return (
    <Drawer
      title="Resumen de Caja y Rendimiento"
      placement="right"
      width={700}
      onClose={onClose}
      open={visible}
    >
      <Title level={4}>Flujo de Caja (Cerrado)</Title>
      <Row gutter={[16, 16]} style={{ marginBottom: "2rem" }}>
        <Col span={24}>
          <Statistic
            title="Recaudación Bruta Final"
            value={totalRecaudado}
            precision={2}
            prefix="$"
            valueStyle={{ color: "#3f8600", fontSize: "2rem" }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Efectivo"
            value={totalEfectivo}
            precision={2}
            prefix={<DollarOutlined />}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Débito"
            value={totalDebito}
            precision={2}
            prefix={<CreditCardOutlined />}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="MercadoPago / QR"
            value={totalQR}
            precision={2}
            prefix={<QrcodeOutlined />}
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
