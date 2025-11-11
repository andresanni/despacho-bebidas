import { Layout, Menu } from 'antd';
import { UserOutlined, CalendarOutlined, ShoppingOutlined } from '@ant-design/icons';
import { Link, Outlet, useLocation } from 'react-router-dom';

const { Sider, Content, Header } = Layout;

const MainLayout = () => {
  const location = useLocation();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth="0">
        <div
          style={{
            color: '#f1f5f9',
            textAlign: 'center',
            padding: '24px 16px',
            fontSize: '32px',
            fontWeight: 800,
            borderBottom: '1px solid #334155',
          }}
        >
          Despacho Bebidas
        </div>
        <Menu
          theme="dark"
          mode="inline"
          style={{ fontWeight: 600 }}
          selectedKeys={[location.pathname]}
          items={[
            {
              key: '/mozos',
              icon: <UserOutlined />,
              label: <Link to="/mozos">Mozos</Link>,
            },
            {
              key: '/jornadas',
              icon: <CalendarOutlined />,
              label: <Link to="/jornadas">Jornadas</Link>,
            },
            {
              key: '/productos',
              icon: <ShoppingOutlined />,
              label: <Link to="/productos">Productos</Link>,
            },
          ]}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid #334155',
          }}
        >
          <h2 style={{ margin: 0, fontWeight: 600 }}>Panel de Control</h2>
        </Header>

        <Content
          style={{
            margin: '24px',
            padding: 24,
            minHeight: 280,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
