import { useEffect, useState } from "react";
import { Row, Col, Typography, Empty, Button } from "antd";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import { ComandaForm } from "../components/ComandaForm";
import { MapaMesas } from "../components/MapaMesas";
import { ArqueoDrawer } from "../components/ArqueoDrawer";
import { getOperacionesConItems } from "../services/operacionesService";

const { Title } = Typography;

export function DespachoView() {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const navigate = useNavigate();
  const jornadaSeleccionada = useAppStore((state) => state.jornadaSeleccionada);
  const setOperacionesActivas = useAppStore(
    (state) => state.setOperacionesActivas,
  );

  useEffect(() => {
    let isMounted = true;
    const fetchOperacionesHistoricas = async () => {
      if (!jornadaSeleccionada) return;
      try {
        const data = await getOperacionesConItems(jornadaSeleccionada.id);
        if (isMounted && data) {
          // Reutilizamos el estado global para llenar el Mapa de Mesas con la foto histórica
          setOperacionesActivas(data as any);
        }
      } catch (error) {
        console.error("Error al cargar operaciones de la jornada:", error);
      }
    };
    fetchOperacionesHistoricas();
    return () => {
      isMounted = false;
    };
  }, [jornadaSeleccionada, setOperacionesActivas]);

  if (!jornadaSeleccionada) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <Empty
          description="Selecciona una jornada del Historial para ver este Despacho"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button type="primary" onClick={() => navigate("/")}>
            Ir al Historial de Ventas
          </Button>
        </Empty>
      </div>
    );
  }

  return (
    <Row
      style={{
        flex: 1,
        display: "flex",
        height: "100%",
        margin: 0,
        minHeight: 0,
      }}
    >
      {/* Mitad Izquierda: Comandas */}
      <Col
        span={8}
        style={{
          height: "100%",
          overflowY: "auto",
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          borderRight: "1px solid #303030",
          maxWidth: "450px",
        }}
      >
        <ComandaForm />
      </Col>

      {/* Mitad Derecha: Mapa de Mesas */}
      <Col
        span={16}
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "2rem",
          backgroundColor: "#1a1a1a",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
            flexShrink: 0,
          }}
        >
          <Title level={3} style={{ margin: 0 }}>
            Mesas Activas
          </Title>
          <Button type="primary" ghost onClick={() => setDrawerVisible(true)}>
            Resumen de Caja
          </Button>
        </div>
        <div style={{ flex: 1, overflow: "hidden" }}>
          <MapaMesas />
        </div>
      </Col>

      {/* Cajón de Arqueo y Rendimiento */}
      <ArqueoDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />
    </Row>
  );
}
