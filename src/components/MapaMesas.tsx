import { useState } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Button,
  Empty,
  Space,
  Select,
} from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import { useAppStore } from "../store/useAppStore";
import { CuentaModal } from "./CuentaModal";

export function MapaMesas() {
  const operacionesActivas = useAppStore((state) => state.operacionesActivas);
  const mozos = useAppStore((state) => state.mozos);

  const [modalVisible, setModalVisible] = useState(false);
  const [operacionSeleccionada, setOperacionSeleccionada] = useState<
    string | null
  >(null);

  const [filtroEstado, setFiltroEstado] = useState<string | null>(null);
  const [filtroMozo, setFiltroMozo] = useState<string | null>(null);

  const handleAbrirModal = (id: string) => {
    setOperacionSeleccionada(id);
    setModalVisible(true);
  };

  const handleCerrarModal = () => {
    setModalVisible(false);
    setOperacionSeleccionada(null);
  };

  const getMozoNombre = (id: string | null) =>
    mozos.find((m) => m.id === id)?.nombre || "Sin asignar";

  const mesasFiltradas = operacionesActivas
    .filter((op) => {
      const cumpleEstado = filtroEstado ? op.estado === filtroEstado : true;
      const cumpleMozo = filtroMozo ? op.mozo_id === filtroMozo : true;
      return cumpleEstado && cumpleMozo;
    })
    .sort((a, b) => a.numero_mesa - b.numero_mesa);

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        overflowY: "auto",
        overflowX: "hidden",
        paddingRight: "12px",
        paddingBottom: "16px",
        scrollbarGutter: "stable",
      }}
    >
      {/* Panel de Filtros */}
      <div
        style={{
          marginBottom: "1.5rem",
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <Select
          allowClear
          placeholder="Filtrar por Estado"
          style={{ width: 200 }}
          value={filtroEstado}
          onChange={setFiltroEstado}
          options={[
            { value: "Abierta", label: "Solo Abiertas" },
            { value: "Pagada", label: "Solo Pagadas" },
          ]}
        />
        <Select
          allowClear
          showSearch
          placeholder="Filtrar por Mozo"
          style={{ width: 200 }}
          value={filtroMozo}
          onChange={setFiltroMozo}
          filterOption={(input, option) =>
            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
          }
          options={mozos.map((m) => ({ value: m.id, label: m.nombre }))}
        />
      </div>

      {mesasFiltradas.length === 0 ? (
        <Empty
          description="No hay mesas abiertas"
          style={{ marginTop: "5rem" }}
        />
      ) : (
        <Row gutter={[16, 16]}>
          {mesasFiltradas.map((op) => (
            <Col xs={24} sm={12} md={12} xl={8} key={op.id}>
              <Card
                title={
                  <Space>
                    <Typography.Title level={4} style={{ margin: 0 }}>
                      Mesa {op.numero_mesa}
                    </Typography.Title>
                    <Tag
                      color={
                        op.estado === "Abierta"
                          ? "green"
                          : op.estado === "Pagada"
                            ? "cyan"
                            : "orange"
                      }
                      icon={
                        op.estado === "Pagada" ? <CheckCircleOutlined /> : null
                      }
                    >
                      {op.estado}
                    </Tag>
                  </Space>
                }
                style={{
                  backgroundColor: "#1f1f1f",
                  borderColor: op.estado === "Pagada" ? "#13c2c2" : "#303030",
                  opacity: op.estado === "Pagada" ? 0.85 : 1,
                }}
              >
                <Typography.Text>
                  Personas: {op.cantidad_personas || "-"}
                </Typography.Text>
                <br />
                <Typography.Text type="secondary">
                  Mozo: {getMozoNombre(op.mozo_id)}
                </Typography.Text>

                <Button
                  type={op.estado === "Pagada" ? "default" : "primary"}
                  ghost={op.estado !== "Pagada"}
                  block
                  style={{ marginTop: "1rem" }}
                  onClick={() => handleAbrirModal(op.id)}
                >
                  {op.estado === "Pagada" ? "Ver Recibo" : "Ver Cuenta"}
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <CuentaModal
        operacionId={operacionSeleccionada}
        visible={modalVisible}
        onClose={handleCerrarModal}
      />
    </div>
  );
}
