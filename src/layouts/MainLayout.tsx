import { Layout, Typography, Menu, Spin, Alert } from "antd";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  AppstoreOutlined,
  UnorderedListOutlined,
  TeamOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import { useAppStore } from "../store/useAppStore";
import { useAppInit } from "../hooks/useAppInit";

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error } = useAppInit();

  const jornadaActiva = useAppStore((state) => state.jornadaActiva);

  const menuItems = [
    {
      key: "/",
      icon: <HistoryOutlined />,
      label: "Jornadas",
    },
    {
      key: "/despacho",
      icon: <AppstoreOutlined />,
      label: "Mesas y Caja",
    },
    {
      key: "/catalogo",
      icon: <UnorderedListOutlined />,
      label: "Catálogo",
    },
    {
      key: "/mozos",
      icon: <TeamOutlined />,
      label: "Mozos",
    },
  ];

  return (
    <Layout style={{ height: "100vh", overflow: "hidden" }}>
      <Sider width={200} style={{ background: "#141414" }}>
        <div style={{ padding: "1rem", textAlign: "center" }}>
          <Title level={4} style={{ color: "#d97706", margin: 0 }}>
            Maria Gracia Bebidas
          </Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          onClick={({ key }) => navigate(key)}
          items={menuItems}
          style={{ borderRight: 0, background: "#141414" }}
        />
      </Sider>

      <Layout style={{ display: "flex", flexDirection: "column" }}>
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
          <div /> {/* Espaciador flexible si se requiere */}
          {jornadaActiva ? (
            <div style={{ display: "flex", gap: "1rem" }}>
              <Alert
                type="success"
                message={`✅ Operando (${new Date(jornadaActiva.creado_en).toLocaleDateString()})`}
                style={{ padding: "4px 12px" }}
              />
            </div>
          ) : (
            <Alert
              type="warning"
              message="🟠 Visualizando en Modo Histórico (Solo Lectura)"
              style={{ padding: "4px 12px" }}
            />
          )}
        </Header>

        <Content
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            minHeight: 0,
            position: "relative",
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

          {!loading && !error && <Outlet />}
        </Content>
      </Layout>
    </Layout>
  );
}
