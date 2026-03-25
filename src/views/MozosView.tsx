import { useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Switch,
  Typography,
  Space,
  message,
  Card,
} from "antd";
import { PlusOutlined, EditOutlined } from "@ant-design/icons";
import { useAppStore } from "../store/useAppStore";
import { upsertMozo, toggleMozoActivo } from "../services/mozosService";
import type { Mozo } from "../types";

const { Title } = Typography;

export function MozosView() {
  const mozos = useAppStore((state) => state.mozos);
  const setMozos = useAppStore((state) => state.setMozos);
  const jornadaActiva = useAppStore((state) => state.jornadaActiva);

  const [modalVisible, setModalVisible] = useState(false);
  const [mozoEditando, setMozoEditando] = useState<Mozo | null>(null);
  const [form] = Form.useForm();
  const [guardando, setGuardando] = useState(false);

  const handleOpenModal = (mozo?: Mozo) => {
    if (mozo) {
      setMozoEditando(mozo);
      form.setFieldsValue(mozo);
    } else {
      setMozoEditando(null);
      form.resetFields();
      form.setFieldsValue({ activo: true });
    }
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setMozoEditando(null);
    form.resetFields();
  };

  const handleGuardar = async (values: any) => {
    try {
      setGuardando(true);
      const payload: Partial<Mozo> = {
        ...values,
        id: mozoEditando?.id,
      };

      const mozoGuardado = await upsertMozo(payload);

      if (mozoEditando) {
        setMozos(
          mozos.map((m) => (m.id === mozoGuardado.id ? mozoGuardado : m)),
        );
      } else {
        setMozos([...mozos, mozoGuardado]);
      }

      message.success("Mozo guardado correctamente");
      handleCloseModal();
    } catch (error: any) {
      console.error("Error guardando mozo:", error);
      message.error(error.message || "Error al guardar el mozo");
    } finally {
      setGuardando(false);
    }
  };

  const handleToggleEstado = async (checked: boolean, mozo: Mozo) => {
    try {
      await toggleMozoActivo(mozo.id, checked);
      setMozos(
        mozos.map((m) => (m.id === mozo.id ? { ...m, activo: checked } : m)),
      );
      message.success(`Mozo ${checked ? "activado" : "pausado"}`);
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
      sorter: (a: Mozo, b: Mozo) => a.nombre.localeCompare(b.nombre),
    },
    {
      title: "Estado",
      key: "estado",
      render: (_: any, record: Mozo) => (
        <Switch
          checked={record.activo !== false}
          onChange={(checked) => handleToggleEstado(checked, record)}
          checkedChildren="Activo"
          unCheckedChildren="Pausado"
          disabled={!!jornadaActiva}
        />
      ),
    },
    {
      title: "Acciones",
      key: "acciones",
      render: (_: any, record: Mozo) => (
        <Button
          type="text"
          icon={<EditOutlined />}
          onClick={() => handleOpenModal(record)}
          disabled={!!jornadaActiva}
        >
          Editar
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: "2rem", height: "100%", overflowY: "auto" }}>
      <Card style={{ backgroundColor: "#171f2c", borderColor: "#1e293b" }}>
        <Space
          style={{
            width: "100%",
            justifyContent: "space-between",
            marginBottom: "1rem",
          }}
        >
          <Title level={3} style={{ margin: 0 }}>
            Gestión de Mozos
          </Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
          >
            Nuevo Mozo
          </Button>
        </Space>

        <Table
          dataSource={mozos}
          columns={columns}
          rowKey="id"
          pagination={false}
          size="middle"
        />
      </Card>

      <Modal
        title={mozoEditando ? "Editar Mozo" : "Nuevo Mozo"}
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
            <Input placeholder="Ej: Juan Pérez" />
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
