import { useState } from 'react';
import { Card, Form, Input, Button, message, Typography } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { login } from '../services/authService';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';

const { Title } = Typography;

export function LoginView() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const usuario = useAppStore((state) => state.usuario);

  // Protección inversa: Si ya hay sesión, rebotar directo al dashboard
  if (usuario) {
    return <Navigate to="/" replace />;
  }

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      await login(values.email, values.password);
      message.success('Acceso correcto');
      navigate("/"); // Redirección activa programática
    } catch (error: any) {
      console.error('Error de login:', error);
      message.error(error.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#0d1421'
    }}>
      <Card style={{ width: 400, backgroundColor: '#171f2c', borderColor: '#1e293b' }} styles={{ body: { padding: '2rem' } }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
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
          <Typography.Text type="secondary">Acceso al Sistema Operativo</Typography.Text>
        </div>

        <Form
          name="login_form"
          layout="vertical"
          onFinish={onFinish}
          size="large"
        >
          <Form.Item
            name="email"
            rules={[{ required: true, message: 'Por favor, ingresa tu email' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Email admin" type="email" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Por favor, ingresa tu contraseña' }]}
            style={{ marginBottom: '2rem' }}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Contraseña maestra" />
          </Form.Item>

          <Form.Item style={{ margin: 0 }}>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Ingresar
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
