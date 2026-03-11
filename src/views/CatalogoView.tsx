import { useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  Typography,
  Space,
  message,
  Card,
} from "antd";
import { PlusOutlined, EditOutlined } from "@ant-design/icons";
import { useAppStore } from "../store/useAppStore";
import { upsertBebida, toggleBebidaActiva } from "../services/catalogoService";
import type { Bebida } from "../types";

const { Title } = Typography;

export function CatalogoView() {
  const bebidas = useAppStore((state) => state.bebidas);
  const setBebidas = useAppStore((state) => state.setBebidas);

  const [modalVisible, setModalVisible] = useState(false);
  const [bebidaEditando, setBebidaEditando] = useState<Bebida | null>(null);
  const [form] = Form.useForm();
  const [guardando, setGuardando] = useState(false);
  const [searchText, setSearchText] = useState("");

  const dataSource = bebidas.filter((b) =>
    b.nombre.toLowerCase().includes(searchText.toLowerCase()),
  );

  const handleOpenModal = (bebida?: Bebida) => {
    if (bebida) {
      setBebidaEditando(bebida);
      form.setFieldsValue(bebida);
    } else {
      setBebidaEditando(null);
      form.resetFields();
      form.setFieldsValue({ activo: true });
    }
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setBebidaEditando(null);
    form.resetFields();
  };

  const handleGuardar = async (values: any) => {
    try {
      setGuardando(true);
      const payload: Partial<Bebida> = {
        ...values,
        id: bebidaEditando?.id, // Supabase genera el UUID si es undefined
      };

      const bebidaGuardada = await upsertBebida(payload);

      // Usar if para Typescript
      if (bebidaEditando) {
        setBebidas(
          bebidas.map((b) => (b.id === bebidaGuardada.id ? bebidaGuardada : b)),
        );
      } else {
        setBebidas([...bebidas, bebidaGuardada]);
      }

      message.success("Bebida guardada correctamente");
      handleCloseModal();
    } catch (error: any) {
      console.error("Error guardando bebida:", error);
      message.error(error.message || "Error al guardar la bebida");
    } finally {
      setGuardando(false);
    }
  };

  const handleToggleEstado = async (checked: boolean, bebida: Bebida) => {
    try {
      await toggleBebidaActiva(bebida.id, checked);
      setBebidas(
        bebidas.map((b) =>
          b.id === bebida.id ? { ...b, activo: checked } : b,
        ),
      );
      message.success(`Bebida ${checked ? "activada" : "pausada"}`);
    } catch (error: any) {
      console.error("Error cambiando estado:", error);
      message.error("Error al actualizar estado");
    }
  };

  const columns = [
    {
      title: "Nombre",
      dataIndex: "nombre",
      key: "nombre",
      sorter: (a: Bebida, b: Bebida) => a.nombre.localeCompare(b.nombre),
    },
    {
      title: "Precio Unitario",
      dataIndex: "precio_actual",
      key: "precio_actual",
      render: (val: number) => `$${val.toFixed(2)}`,
      sorter: (a: Bebida, b: Bebida) => a.precio_actual - b.precio_actual,
    },
    {
      title: "Estado",
      key: "estado",
      render: (_: any, record: Bebida) => (
        <Switch
          checked={record.activo !== false} // Permisivo si el DB anterior es ambiguo
          onChange={(checked) => handleToggleEstado(checked, record)}
          checkedChildren="Activo"
          unCheckedChildren="Pausado"
        />
      ),
    },
    {
      title: "Acciones",
      key: "acciones",
      render: (_: any, record: Bebida) => (
        <Button
          type="text"
          icon={<EditOutlined />}
          onClick={() => handleOpenModal(record)}
        >
          Editar
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: "2rem", height: "100%", overflowY: "auto" }}>
      <Card style={{ backgroundColor: "#1f1f1f", borderColor: "#303030" }}>
        <Space
          style={{
            width: "100%",
            justifyContent: "space-between",
            marginBottom: "1rem",
          }}
        >
          <Title level={3} style={{ margin: 0 }}>
            Catálogo de Bebidas
          </Title>
        </Space>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "1rem",
          }}
        >
          <Input.Search
            placeholder="Buscar bebida..."
            allowClear
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
          >
            Nueva Bebida
          </Button>
        </div>

        <Table
          dataSource={dataSource}
          columns={columns}
          rowKey="id"
          pagination={false}
          size="middle"
        />
      </Card>

      <Modal
        title={bebidaEditando ? "Editar Bebida" : "Nueva Bebida"}
        open={modalVisible}
        onCancel={handleCloseModal}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleGuardar}
          style={{ marginTop: "1rem" }}
        >
          <Form.Item
            label="Nombre"
            name="nombre"
            rules={[{ required: true, message: "El nombre es obligatorio" }]}
          >
            <Input placeholder="Ej: Coca Cola 1L" />
          </Form.Item>

          <Form.Item
            label="Precio de Venta"
            name="precio_actual"
            rules={[{ required: true, message: "El precio es obligatorio" }]}
          >
            <InputNumber
              min={0}
              step={100}
              style={{ width: "100%" }}
              prefix="$"
            />
          </Form.Item>

          <Form.Item
            label="Estado Inicial"
            name="activo"
            valuePropName="checked"
          >
            <Switch checkedChildren="Activo" unCheckedChildren="Pausado" />
          </Form.Item>

          <Button type="primary" htmlType="submit" block loading={guardando}>
            Guardar
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
