import { useEffect, useState } from 'react';
import { 
  Button, 
  Table, 
  Space, 
  Modal, 
  Form, 
  Input, 
  Switch, 
  Popconfirm, 
  message, 
  Tag, 
  Tooltip 
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  UserOutlined,
  StopOutlined 
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Mozo } from '../types/models';
import { mozoService } from '../services/mozoService';

// ------------------------------------------------------------------
// [COMPONENTE PRINCIPAL]
// ------------------------------------------------------------------
export default function MozosPage() {
  const [mozos, setMozos] = useState<Mozo[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Estados de Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingMozo, setEditingMozo] = useState<Mozo | null>(null);

  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await mozoService.getAll();
      setMozos(data);
    } catch (error) {
      message.error('Error al cargar los mozos');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async (values: any) => {
    setSubmitting(true);
    try {
      if (editingMozo) {
        await mozoService.update(editingMozo.idMozo, values);
        message.success('Mozo actualizado correctamente');
      } else {
        await mozoService.create(values);
        message.success('Mozo creado correctamente');
      }
      setModalOpen(false);
      form.resetFields();
      loadData();
    } catch (error) {
      message.error('Ocurrió un error al guardar');
    } finally {
      setSubmitting(false);
    }
  };

  // CAMBIO: Manejamos la baja lógica
  const handleDeactivate = async (id: number) => {
    try {
      await mozoService.softDelete(id);
      message.success('Mozo dado de baja correctamente');
      loadData();
    } catch (error) {
      message.error('No se pudo dar de baja al mozo');
    }
  };

  const openNewModal = () => {
    setEditingMozo(null);
    form.resetFields(); 
    setModalOpen(true);
  };

  const openEditModal = (record: Mozo) => {
    setEditingMozo(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const columns: ColumnsType<Mozo> = [
    { 
      title: 'Nombre', 
      dataIndex: 'nombre',
      sorter: (a, b) => a.nombre.localeCompare(b.nombre),
      render: (text, record) => (
        <span style={{ 
          fontWeight: 500,
          // Visualmente tachamos o atenuamos si está inactivo
          color: record.activo ? 'inherit' : '#999',
          textDecoration: record.activo ? 'none' : 'line-through' 
        }}>
          {text}
        </span>
      )
    },
    {
      title: 'Estado',
      dataIndex: 'activo',
      align: 'center',
      width: 100,
      render: (activo: boolean) => (
        <Tag color={activo ? 'success' : 'default'}>
          {activo ? 'Activo' : 'Inactivo'}
        </Tag>
      ),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      align: 'right',
      width: 120,
      render: (_, record) => (
        <Space split={null}>
          <Tooltip title="Editar / Reactivar">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => openEditModal(record)} 
              className="text-blue-600 hover:text-blue-800"
            />
          </Tooltip>

          {/* CAMBIO: Solo mostramos el botón de "Dar de baja" si está activo.
             Si ya está inactivo, no tiene sentido mostrarlo (se reactiva desde editar).
          */}
          {record.activo && (
            <Popconfirm 
              title="¿Dar de baja al mozo?" 
              description="Pasará a estado inactivo, pero se mantendrá su historial."
              onConfirm={() => handleDeactivate(record.idMozo)}
              okText="Dar de baja"
              cancelText="Cancelar"
              okButtonProps={{ danger: true }}
              icon={<StopOutlined style={{ color: 'red' }} />}
            >
              <Tooltip title="Dar de baja">
                <Button 
                  type="text" 
                  danger 
                  icon={<DeleteOutlined />} 
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px' }}>Mozos</h2>
          <span style={{ color: '#888' }}>Administración del personal de servicio</span>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openNewModal}>
          Nuevo Mozo
        </Button>
      </div>

      <Table
        rowKey="idMozo"
        loading={loading}
        columns={columns}
        dataSource={mozos}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 600 }}
      />

      <Modal
        open={modalOpen}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserOutlined /> 
            {editingMozo ? 'Editar Mozo' : 'Nuevo Mozo'}
          </div>
        }
        onCancel={() => setModalOpen(false)}
        onOk={form.submit}
        confirmLoading={submitting} 
        okText={editingMozo ? 'Guardar' : 'Crear'}
        cancelText="Cancelar"
        destroyOnClose
      >
        <Form 
          form={form} 
          layout="vertical" 
          onFinish={handleFinish} 
          initialValues={{ activo: true }}
          preserve={false}
        >
          <Form.Item
            name="nombre"
            label="Nombre Completo"
            rules={[{ required: true, message: 'Ingrese el nombre del mozo' }]}
          >
            <Input placeholder="Ej: Juan Pérez" />
          </Form.Item>

          <Form.Item 
            name="activo" 
            label="Estado" 
            valuePropName="checked"
            help="Los mozos inactivos no aparecerán en la selección de mesas."
          >
            <Switch checkedChildren="Activo" unCheckedChildren="Inactivo" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}