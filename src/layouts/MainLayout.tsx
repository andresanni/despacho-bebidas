import { Layout, Typography, Menu, Spin, Alert, Button, message } from "antd";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  AppstoreOutlined,
  UnorderedListOutlined,
  TeamOutlined,
  HistoryOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { useAppStore } from "../store/useAppStore";
import { useAppInit } from "../hooks/useAppInit";
import { logout } from "../services/authService";

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
    <Layout className="app-shell">
      <Sider width={220} className="app-sider">
        <div className="brand-block">
          <div className="brand-mark">
            <span className="brand-kicker">POS Restaurante</span>
            <Title level={3} className="brand-title">
              MARIA GRACIA
            </Title>
          </div>
        </div>
        <Menu
          className="app-menu"
          mode="inline"
          selectedKeys={[location.pathname]}
          onClick={({ key }) => navigate(key)}
          items={menuItems.map(item => ({ ...item, style: { fontWeight: 600 } }))}
        />
      </Sider>

      <Layout style={{ display: "flex", flexDirection: "column" }}>
        <Header className="app-header">
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            {jornadaActiva ? (
              <Alert
                className="status-alert"
                type="success"
                message={`✅ Operando (${new Date(jornadaActiva.creado_en).toLocaleDateString()})`}
                style={{ padding: "4px 12px" }}
              />
            ) : (
              <Alert
                className="status-alert"
                type="warning"
                message="🟠 Visualizando en Modo Histórico (Solo Lectura)"
                style={{ padding: "4px 12px" }}
              />
            )}
            <Button
              type="text"
              danger
              icon={<LogoutOutlined />}
              onClick={async () => {
                try {
                  await logout();
                  message.success("Sesión cerrada correctamente");
                } catch (error: any) {
                  message.error(error.message || "Error al cerrar sesión");
                }
              }}
            >
              Cerrar Sesión
            </Button>
          </div>
        </Header>

        <Content className="app-content">
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
