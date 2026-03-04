import { useState } from "react";
import {
  ConfigProvider,
  Layout,
  Spin,
  Alert,
  Button,
  Row,
  Col,
  Typography,
  theme,
  message,
} from "antd";
import { useAppInit } from "./hooks/useAppInit";
import { useAppStore } from "./store/useAppStore";
import { create, update } from "./services/baseService";
import type { Jornada } from "./types";
import { ComandaForm } from "./components/ComandaForm";
import { MapaMesas } from "./components/MapaMesas";

const { Header, Content } = Layout;
const { Title } = Typography;

function App() {
  const { loading, error } = useAppInit();
  const jornadaActual = useAppStore((state) => state.jornadaActual);
  const setJornadaActual = useAppStore((state) => state.setJornadaActual);

  const [creandoJornada, setCreandoJornada] = useState(false);
  const [cerrandoJornada, setCerrandoJornada] = useState(false);

  const handleAbrirJornada = async () => {
    try {
      setCreandoJornada(true);
      const nuevaJornada = await create<Jornada>("jornadas", {
        estado: "abierta",
      });
      setJornadaActual(nuevaJornada);
      message.success("Jornada abierta exitosamente.");
    } catch (err: any) {
      console.error("Error abriendo jornada:", err);
      message.error(err.message || "Se produjo un error al abrir la jornada.");
    } finally {
      setCreandoJornada(false);
    }
  };

  const handleCerrarJornada = async () => {
    if (!jornadaActual) return;

    try {
      setCerrandoJornada(true);
      await update<Jornada>("jornadas", jornadaActual.id, {
        estado: "cerrada",
      });
      setJornadaActual(null);
      message.success("Jornada cerrada exitosamente.");
    } catch (err: any) {
      console.error("Error cerrando jornada:", err);
      message.error(err.message || "Se produjo un error al cerrar la jornada.");
    } finally {
      setCerrandoJornada(false);
    }
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: "#d97706", // Naranja cálido (estilo gastronomía)
          colorBgBase: "#121212",
          colorTextBase: "#ffffff",
        },
      }}
    >
      <Layout
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 2rem",
            borderBottom: "1px solid #303030",
            backgroundColor: "#121212",
          }}
        >
          <Title level={4} style={{ margin: 0, color: "#d97706" }}>
            Sistema de Despacho
          </Title>
          {jornadaActual && (
            <Button
              danger
              loading={cerrandoJornada}
              onClick={handleCerrarJornada}
            >
              Cerrar Jornada
            </Button>
          )}
        </Header>

        <Content
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            minHeight: 0,
          }}
        >
          {loading && (
            <div
              style={{
                flex: 1,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Spin size="large" description="Cargando sistema..." />
            </div>
          )}

          {!loading && error && (
            <div
              style={{
                flex: 1,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "2rem",
              }}
            >
              <Alert
                message="Error de Inicialización"
                description={error}
                type="error"
                showIcon
                style={{ maxWidth: "600px" }}
              />
            </div>
          )}

          {!loading && !error && !jornadaActual && (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: "1.5rem",
              }}
            >
              <Title level={2} style={{ margin: 0 }}>
                Despacho de Bebidas
              </Title>
              <Typography.Text type="secondary">
                No hay ninguna jornada abierta en este momento.
              </Typography.Text>
              <Button
                type="primary"
                size="large"
                onClick={handleAbrirJornada}
                loading={creandoJornada}
              >
                Abrir Nueva Jornada
              </Button>
            </div>
          )}

          {!loading && !error && jornadaActual && (
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
                span={12}
                style={{
                  height: "100%",
                  overflowY: "auto",
                  padding: "2rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                  borderRight: "1px solid #303030",
                }}
              >
                <ComandaForm />
              </Col>

              {/* Mitad Derecha: Mapa de Mesas */}
              <Col
                span={12}
                style={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  padding: "2rem",
                  backgroundColor: "#1a1a1a",
                  overflow: "hidden",
                }}
              >
                <Title
                  level={3}
                  style={{ marginBottom: "1.5rem", flexShrink: 0 }}
                >
                  Mesas Activas
                </Title>
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <MapaMesas />
                </div>
              </Col>
            </Row>
          )}
        </Content>
      </Layout>
    </ConfigProvider>
  );
}

export default App;
