import { useState } from "react";
import {
  Form,
  InputNumber,
  Select,
  Button,
  Space,
  Typography,
  Divider,
  Card,
  message,
} from "antd";
import { PlusOutlined, MinusCircleOutlined } from "@ant-design/icons";
import { useAppStore } from "../store/useAppStore";
import {
  registrarComanda,
  getOperacionesConItems,
} from "../services/operacionesService";

const { Title, Text } = Typography;

export function ComandaForm() {
  const [form] = Form.useForm();
  const mozos = useAppStore((state) => state.mozos);
  const bebidas = useAppStore((state) => state.bebidas);
  const jornadaSeleccionada = useAppStore((state) => state.jornadaSeleccionada);
  const operacionesActivas = useAppStore((state) => state.operacionesActivas);
  const setOperacionesActivas = useAppStore(
    (state) => state.setOperacionesActivas,
  );

  // Solo mostrar bebidas activas en el selector de la comanda
  const bebidasActivas = bebidas.filter((b) => b.activo !== false);
  const mozosActivos = mozos.filter((m) => m.activo !== false);

  const esModoMuseo = jornadaSeleccionada?.estado === "cerrada";

  const mesaSeleccionada = Form.useWatch("numero_mesa", form);
  const esMesaExistente = !!operacionesActivas.find(
    (op) => op.numero_mesa === mesaSeleccionada && op.estado === "Abierta",
  );

  const [enviando, setEnviando] = useState(false);

  const onFinish = async (values: any) => {
    if (!jornadaSeleccionada) {
      message.error("No hay una jornada seleccionada.");
      return;
    }

    try {
      setEnviando(true);
      await registrarComanda(
        jornadaSeleccionada.id,
        values,
        bebidas,
      );

      // Sincronización Reactiva de Todo el Mapa
      if (jornadaSeleccionada) {
        const dataRefrescada = await getOperacionesConItems(
          jornadaSeleccionada.id,
        );
        setOperacionesActivas(dataRefrescada as any);
      }

      message.success("Comanda registrada");
      form.resetFields();
    } catch (error: any) {
      console.error("Error al registrar comanda:", error);
      message.error(error.message || "Error al intentar registrar la comanda");
    } finally {
      setEnviando(false);
    }
  };

  const handleValuesChange = (changedValues: any) => {
    if (changedValues.numero_mesa !== undefined) {
      const mesaExistente = operacionesActivas.find(
        (op) => op.numero_mesa === changedValues.numero_mesa && op.estado === "Abierta",
      );

      if (mesaExistente) {
        form.setFieldsValue({
          mozo_id: mesaExistente.mozo_id,
          cantidad_personas: mesaExistente.cantidad_personas,
        });
      } else {
        form.setFieldsValue({
          mozo_id: undefined,
          cantidad_personas: 1,
        });
      }
    }
  };

  if (esModoMuseo) {
    return (
      <div
        style={{
          padding: "2rem",
          textAlign: "center",
          backgroundColor: "#1a1a1a",
          borderRadius: "8px",
          border: "1px dashed #444",
        }}
      >
        <Typography.Title level={4} style={{ color: "#888" }}>
          Modo Histórico
        </Typography.Title>
        <Typography.Text type="secondary">
          Esta jornada está cerrada. No se pueden agregar nuevas comandas.
        </Typography.Text>
      </div>
    );
  }

  return (
    <Card
      style={{
        width: "100%",
        maxWidth: 600,
        margin: "0 auto",
        backgroundColor: "#1f1f1f",
        borderColor: "#303030",
      }}
    >
      <Title level={4} style={{ textAlign: "center", marginBottom: "2rem" }}>
        Nueva Comanda
      </Title>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        onValuesChange={handleValuesChange}
        autoComplete="off"
        initialValues={{ items: [{}] }}
      >
        <Form.Item
          label="Número de Mesa"
          name="numero_mesa"
          rules={[
            { required: true, message: "Por favor ingrese el número de mesa" },
          ]}
        >
          <Select
            showSearch
            placeholder="Ej: 12"
            options={Array.from({ length: 100 }, (_, i) => ({
              value: i + 1,
              label: `${i + 1}`,
            }))}
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>

        <Form.Item
          label="Mozo"
          name="mozo_id"
          rules={[{ required: true, message: "Por favor seleccione un mozo" }]}
        >
          <Select placeholder="Seleccionar mozo" disabled={esMesaExistente}>
            {mozosActivos.map((mozo) => (
              <Select.Option key={mozo.id} value={mozo.id}>
                {mozo.nombre}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="Cantidad de Personas" name="cantidad_personas">
          <Select
            showSearch
            placeholder="Ej: 4"
            disabled={esMesaExistente}
            options={Array.from({ length: 100 }, (_, i) => ({
              value: i + 1,
              label: `${i + 1}`,
            }))}
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>

        <Divider>
          <Text type="secondary">Bebidas</Text>
        </Divider>

        <Form.List name="items">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }, index) => (
                <Space
                  key={key}
                  style={{ display: "flex", marginBottom: 8 }}
                  align="baseline"
                >
                  <Form.Item
                    {...restField}
                    name={[name, "bebida_id"]}
                    rules={[{ required: true, message: "Seleccione bebida" }]}
                    style={{ width: 220, marginBottom: 0 }}
                  >
                    <Select placeholder="Bebida">
                      {bebidasActivas.map((bebida) => (
                        <Select.Option key={bebida.id} value={bebida.id}>
                          {bebida.nombre}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item
                    {...restField}
                    name={[name, "cantidad"]}
                    rules={[{ required: true, message: "Falta cantidad" }]}
                    initialValue={1}
                    style={{ width: 80, marginBottom: 0 }}
                  >
                    <InputNumber min={1} style={{ width: "100%" }} />
                  </Form.Item>

                  <Button
                    type="text"
                    danger
                    icon={<MinusCircleOutlined />}
                    onClick={() => remove(name)}
                    disabled={fields.length === 1 && index === 0}
                  />
                </Space>
              ))}

              <Form.Item style={{ marginTop: "1rem" }}>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusOutlined />}
                >
                  Agregar Bebida
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

        <Button
          type="primary"
          htmlType="submit"
          size="large"
          block
          loading={enviando}
          style={{ marginTop: "1rem", fontWeight: "bold" }}
        >
          Registrar Comanda
        </Button>
      </Form>
    </Card>
  );
}
