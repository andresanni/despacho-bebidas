import { useState } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Button,
  Empty,
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

  const getMozoNombre = (id1: string | null, id2?: string | null) => {
    const mozo1 = mozos.find((m) => m.id === id1)?.nombre || "Sin asignar";
    if (id2) {
      const mozo2 = mozos.find((m) => m.id === id2)?.nombre || "Desconocido";
      return `${mozo1} & ${mozo2}`;
    }
    return mozo1;
  };

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
        paddingRight: "2rem",
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
            <Col xs={24} sm={12} md={8} lg={6} xl={6} key={op.id}>
              <Card
                title={
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <div style={{ textAlign: "left" }}>
                      <Typography.Title level={4} style={{ margin: 0 }}>
                        Mesa {op.numero_mesa}
                      </Typography.Title>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px", marginBottom: "4px" }}>
                      {(() => {
                        if (op.estado === "Pagada") {
                          if (op.metodo_pago === "Incobrable") {
                            return <Tag color="red" style={{ margin: 0 }}>Incobrable</Tag>;
                          }
                          if (op.metodo_pago === "Bonificación 100%" || op.total_neto === 0) {
                            return <Tag style={{ backgroundColor: "#334155", color: "#cbd5e1", border: "1px solid #475569", margin: 0 }}>Bonificada</Tag>;
                          }
                          return (
                            <Tag icon={<CheckCircleOutlined />} style={{ backgroundColor: "#164e63", color: "#22d3ee", border: "1px solid #155e75", margin: 0 }}>
                              Pagada
                            </Tag>
                          );
                        }
                        return (
                          <Tag 
                            style={op.estado === "Abierta" 
                              ? { backgroundColor: "#064e3b", color: "#34d399", border: "1px solid #059669", margin: 0 }
                              : { backgroundColor: "#78350f", color: "#fbbf24", border: "1px solid #b45309", margin: 0 }
                            }
                          >
                            {op.estado}
                          </Tag>
                        );
                      })()}
                    </div>
                  </div>
                }
                style={{
                  backgroundColor: "#171f2c",
                  borderColor: op.estado === "Pagada" ? "#155e75" : "#1e293b",
                  opacity: op.estado === "Pagada" ? 0.85 : 1,
                }}
                styles={{ body: { padding: "10px 12px 12px" } }}
              >
                {/* Fila 1: Mozo e Importe */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.2rem" }}>
                  <Typography.Text style={{ fontSize: "14px", fontWeight: 600, color: "#f8f9fa" }}>
                    {getMozoNombre(op.mozo_id, op.mozo_id_2)}
                  </Typography.Text>
                  
                  {/* Subtotal en Vivo */}
                  <div>
                    {op.items_operacion && op.items_operacion.length > 0 ? (
                      (() => {
                        const totalVivo = op.items_operacion.reduce((acc: number, item: any) => {
                          const cantCobrar = item.cantidad - item.cantidad_bonificada_100 - (item.cantidad_bonificada_50 * 0.5);
                          return acc + (cantCobrar * item.precio_unitario);
                        }, 0);

                        if (totalVivo > 0) {
                          return (
                            <Typography.Text style={{ fontSize: "16px", fontWeight: "bold", color: '#0e7490' }}>
                              $ {totalVivo.toLocaleString('es-AR')}
                            </Typography.Text>
                          );
                        } else {
                          return <Tag style={{ margin: 0, fontSize: "12px", backgroundColor: "#1e293b", color: "#94a3b8", border: "1px solid #334155", fontWeight: 600 }}>🎁 $0</Tag>;
                        }
                      })()
                    ) : (
                      <Typography.Text italic type="secondary" style={{ fontSize: "12px" }}>Mesa Vacía</Typography.Text>
                    )}
                  </div>
                </div>

                {/* Fila 2: Personas */}
                <div style={{ marginBottom: "0.25rem", textAlign: "center" }}>
                  <Typography.Text style={{ fontSize: "15px", color: "#cbd5e1", fontWeight: 500 }}>
                    {op.cantidad_personas || "-"} personas
                  </Typography.Text>
                </div>

                <Button
                  type={op.estado === "Pagada" ? "default" : "primary"}
                  ghost={op.estado !== "Pagada"}
                  block
                  style={{ marginTop: "0.5rem" }}
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
