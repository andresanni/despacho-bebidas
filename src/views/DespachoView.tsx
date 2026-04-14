import { useEffect, useState } from "react";
import { Row, Col, Typography, Empty, Button, Modal, Input, message, Space } from "antd";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import { ComandaForm } from "../components/ComandaForm";
import { MapaMesas } from "../components/MapaMesas";
import { ArqueoDrawer } from "../components/ArqueoDrawer";
import { getOperacionesConItems, guardarCambiosCuenta } from "../services/operacionesService";
import { actualizarUrlCaja } from "../services/jornadasService";
import { SettingOutlined, ThunderboltOutlined } from "@ant-design/icons";

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
  const operacionesActivas = useAppStore((state) => state.operacionesActivas);
  const bebidas = useAppStore((state) => state.bebidas);


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

  const aplicarBonificacionesMasivas = () => {
    if (!jornadaSeleccionada) return;

    const mesasValidas: typeof operacionesActivas = [];
    
    operacionesActivas.forEach(op => {
      if (op.estado !== 'Abierta') return;
      
      const opsDeEstaMesa = operacionesActivas
        .filter(o => o.numero_mesa === op.numero_mesa)
        .sort((a, b) => new Date(a.creado_en).getTime() - new Date(b.creado_en).getTime());
        
      const esSegundaInstancia = opsDeEstaMesa.findIndex((o) => o.id === op.id) > 0;
      if (!esSegundaInstancia && (op.cantidad_personas || 0) > 0) {
        mesasValidas.push(op);
      }
    });

    if (mesasValidas.length === 0) {
      return message.info("No hay mesas válidas o con comensales para bonificar.");
    }

    Modal.confirm({
      title: '¿Aplicar bonificaciones automáticas a todas las mesas?',
      content: `Se procesarán ${mesasValidas.length} mesas abiertas principales.`,
      okText: 'Sí, aplicar',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          const allItemsToUpdate: any[] = [];
          let mesasAfectadas = 0;

          mesasValidas.forEach(op => {
            const personas = op.cantidad_personas || 0;
            let creditos100 = Math.floor(personas / 2);
            let creditos50 = personas % 2 === 1 ? 1 : 0;
            
            if (creditos100 === 0 && creditos50 === 0) return;

            const itemsDeOp = op.items_operacion || [];
            
            const itemsMapeados = itemsDeOp.map(item => ({
              id: item.id,
              bebida: bebidas.find(b => b.id === item.bebida_id),
              cantidad: item.cantidad,
              precio: item.precio_unitario,
              b100: 0,
              b50: 0
            }));

            const bonificables = itemsMapeados
              .filter(item => item.bebida?.es_bonificable)
              .sort((a, b) => b.precio - a.precio);

            const unidadesDisponibles: any[] = [];
            bonificables.forEach(item => {
              for (let i = 0; i < item.cantidad; i++) {
                  unidadesDisponibles.push({ ref: item, precio: item.precio, usada: false });
              }
            });

            for (let i = 0; i < unidadesDisponibles.length; i++) {
              const u = unidadesDisponibles[i];
              if (creditos100 > 0) {
                u.ref.b100 += 1;
                creditos100--;
                u.usada = true;
              }
            }

            const restantes = unidadesDisponibles.filter(u => !u.usada);
            if (creditos50 > 0 && restantes.length > 0) {
               restantes[0].ref.b50 += 1;
               creditos50--;
            }

            let mesaModificada = false;
            itemsMapeados.forEach(item => {
              const original = itemsDeOp.find(i => i.id === item.id);
              if (original && (original.cantidad_bonificada_100 !== item.b100 || original.cantidad_bonificada_50 !== item.b50)) {
                  allItemsToUpdate.push({
                      id: item.id,
                      cantidad: item.cantidad,
                      cantidad_bonificada_100: item.b100,
                      cantidad_bonificada_50: item.b50
                  });
                  mesaModificada = true;
              }
            });
            if(mesaModificada) mesasAfectadas++;
          });

          if (allItemsToUpdate.length > 0) {
            await guardarCambiosCuenta(allItemsToUpdate, []);
            const data = await getOperacionesConItems(jornadaSeleccionada.id);
            if (data) setOperacionesActivas(data as any);
            message.success(`Se bonificaron ${mesasAfectadas} mesas con éxito.`);
          } else {
            message.info("Las mesas ya tienen sus bonificaciones integradas o no disponen de bebidas de cortesía en sus comandas.");
          }
        } catch (error) {
           console.error(error);
           message.error("Ocurrió un error al aplicar las bonificaciones masivas.");
        }
      }
    });
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
          borderRight: "1px solid #1e293b",
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
          backgroundColor: "#0d1421",
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
              icon={<ThunderboltOutlined />}
              onClick={aplicarBonificacionesMasivas}
            >
              Bonificaciones Automáticas
            </Button>
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
