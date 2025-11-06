import { Button, Layout } from 'antd';
const { Content } = Layout;

function App() {
  return (
    <Layout style={{ minHeight: '100vh', background: '#0D0C1D' }}>
      <Content style={{ padding: 24 }}>
        <Button type="primary">Botón principal</Button>
        <Button>Clic común</Button>
        {/* contenido de prueba */}
      </Content>
    </Layout>
  );
}

export default App;
