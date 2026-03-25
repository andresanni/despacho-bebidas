import { Layout, Typography, Menu, Spin, Alert, Button, message, ConfigProvider, theme } from "antd";
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
    <Layout style={{ height: "100vh", overflow: "hidden" }}>
      <Sider width={200} style={{ background: "#0d1421", borderRight: "1px solid #1e293b" }}>
        <div style={{ padding: "1.5rem 1rem", textAlign: "center" }}>
          <Title 
            level={3} 
            style={{ 
              color: "#cbd5e1", 
              margin: 0, 
              fontWeight: "700",
              textTransform: "uppercase",
              fontSize: "20px"
            }}
          >
            MARIA GRACIA
          </Title>
          <div style={{ 
            height: "1px", 
            background: "#1e293b", 
            margin: "0.8rem auto 0",
            width: "100%",
          }} />
        </div>
        <ConfigProvider
          theme={{
            algorithm: theme.darkAlgorithm,
            components: {
              Menu: {
                itemSelectedBg: "#171f2c",
                itemSelectedColor: "#ffffff",
                itemHoverBg: "#171f2c",
                itemActiveBg: "#171f2c",
                itemColor: "#94a3b8",
                itemHoverColor: "#ffffff",
              }
            }
          }}
        >
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            onClick={({ key }) => navigate(key)}
            items={menuItems.map(item => ({ ...item, style: { fontWeight: 500 } }))}
            style={{ borderRight: 0, background: "#0d1421", marginTop: "1rem" }}
          />
        </ConfigProvider>
      </Sider>

      <Layout style={{ display: "flex", flexDirection: "column" }}>
        <Header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 2rem",
            borderBottom: "1px solid #1e293b",
            backgroundColor: "#0d1421",
          }}
        >
          <div /> {/* Espaciador flexible si se requiere */}
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            {jornadaActiva ? (
              <Alert
                type="success"
                message={`✅ Operando (${new Date(jornadaActiva.creado_en).toLocaleDateString()})`}
                style={{ padding: "4px 12px" }}
              />
            ) : (
              <Alert
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
