import { useEffect, useState } from "react";
import { Row, Col, Typography, Empty, Button, Modal, Input, message, Space } from "antd";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import { ComandaForm } from "../components/ComandaForm";
import { MapaMesas } from "../components/MapaMesas";
import { ArqueoDrawer } from "../components/ArqueoDrawer";
import { getOperacionesConItems } from "../services/operacionesService";
import { actualizarUrlCaja } from "../services/jornadasService";
import { SettingOutlined } from "@ant-design/icons";

const { Title } = Typography;

export function DespachoView() {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [configUrlVisible, setConfigUrlVisible] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [guardandoUrl, setGuardandoUrl] = useState(false);

  const navigate = useNavigate();
  const jornadaSeleccionada = useAppStore((state) => state.jornadaSeleccionada);
  const setOperacionesActivas = useAppStore(
    (state) => state.setOperacionesActivas,
  );
  const setJornadaSeleccionada = useAppStore(
    (state) => state.setJornadaSeleccionada,
  );
  const fetchMesasCaja = useAppStore((state) => state.fetchMesasCaja);
  const verificarCambiosDeCaja = useAppStore((state) => state.verificarCambiosDeCaja);


  const handleOpenConfig = () => {
    setUrlInput(jornadaSeleccionada?.url_caja_sheets || "");
    setConfigUrlVisible(true);
  };

  const handleSaveUrl = async () => {
    if (!jornadaSeleccionada) return;
    setGuardandoUrl(true);
    try {
      const urlAguardar = urlInput.trim() === "" ? null : urlInput.trim();
      await actualizarUrlCaja(jornadaSeleccionada.id, urlAguardar);
      setJornadaSeleccionada({
        ...jornadaSeleccionada,
        url_caja_sheets: urlAguardar,
      });
      message.success("URL de caja externa actualizada correctamente");
      setConfigUrlVisible(false);
    } catch (error) {
      console.error("Error al guardar URL:", error);
      message.error("Error al guardar la URL de la caja externa");
    } finally {
      setGuardandoUrl(false);
    }
  };

  useEffect(() => {
    // Carga inicial
    fetchMesasCaja().then(() => verificarCambiosDeCaja());
    
    const interval = setInterval(async () => {
      await fetchMesasCaja();
      await verificarCambiosDeCaja();
    }, 15000);
    
    return () => clearInterval(interval);
  }, [fetchMesasCaja, verificarCambiosDeCaja]);

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
          padding: "2rem 0 2rem 1.5rem",
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
        span={16}
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "2rem 0 2rem 2rem",
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
          <Space>
            <Button
              icon={<SettingOutlined />}
              onClick={handleOpenConfig}
            >
              Caja Externa
            </Button>
            <Button type="primary" ghost onClick={() => setDrawerVisible(true)}>
              Resumen de Caja
            </Button>
          </Space>
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

      {/* Modal de Configuración de Caja Externa */}
      <Modal
        title="Configurar URL de Caja Externa (Google Sheets)"
        open={configUrlVisible}
        onCancel={() => setConfigUrlVisible(false)}
        onOk={handleSaveUrl}
        confirmLoading={guardandoUrl}
        okText="Guardar"
        cancelText="Cancelar"
      >
        <Typography.Paragraph>
          Ingresa la URL del Google Apps Script para esta jornada. Si la dejas en blanco,
          se desactivará la auto-sincronización de cantidad de personas.
        </Typography.Paragraph>
        <Input
          placeholder="https://script.google.com/macros/s/..."
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
        />
      </Modal>
    </Row>
  );
}
