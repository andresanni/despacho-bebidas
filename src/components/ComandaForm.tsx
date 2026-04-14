import { useState } from "react";
import {
  Form,
  InputNumber,
  Select,
  Button,
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
  const mozo1Seleccionado = Form.useWatch("mozo_id", form);
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
    (op) => op.numero_mesa === mesaSeleccionada,
  );

  const [enviando, setEnviando] = useState(false);
  const [mostrarMozoApoyo, setMostrarMozoApoyo] = useState(false);
  const mesasCaja = useAppStore((state) => state.mesasCaja);

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
      setMostrarMozoApoyo(false);
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
        (op) => op.numero_mesa === changedValues.numero_mesa,
      );

      if (mesaExistente) {
        form.setFieldsValue({
          mozo_id: mesaExistente.mozo_id,
          cantidad_personas: mesaExistente.cantidad_personas,
        });
      } else {
        // Es una mesa virgen en el sistema. Buscamos en el staging de CAJA.
        const mesaDesdeCaja = mesasCaja.find((m) => m.mesa === changedValues.numero_mesa);
        
        form.setFieldsValue({
          mozo_id: undefined,
          cantidad_personas: mesaDesdeCaja ? mesaDesdeCaja.personas : 1,
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
          backgroundColor: "#171f2c",
          borderRadius: "8px",
          border: "1px dashed #1e293b",
        }}
      >
        <Typography.Title level={4} style={{ color: "#cbd5e1" }}>
          Modo Histórico
        </Typography.Title>
        <Typography.Text style={{ color: "#94a3b8" }}>
          Esta jornada está cerrada. No se pueden agregar nuevas comandas.
        </Typography.Text>
      </div>
    );
  }

  return (
    <Card
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "transparent",
        border: "none",
        display: "flex",
        flexDirection: "column",
        overflowX: "hidden",
      }}
      styles={{ body: { padding: 0, display: "flex", flexDirection: "column", height: "100%" } }}
    >
      {/* Cabezal fijo */}
      <div style={{ paddingRight: "1.5rem" }}>
        <Title level={4} style={{ textAlign: "left", marginTop: 0, marginBottom: "1.5rem" }}>
          Nueva Comanda
        </Title>
      </div>

      {/* Contenedor del formulario scrolleable */}
      <div style={{ flex: 1, overflowY: "auto", paddingRight: "1.5rem" }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        onValuesChange={handleValuesChange}
        autoComplete="off"
        initialValues={{ items: [{}] }}
      >
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
          <Form.Item
            label="Número de Mesa"
            name="numero_mesa"
            rules={[
              { required: true, message: "Por favor ingrese el número de mesa" },
            ]}
            style={{ flex: 1, marginBottom: 0 }}
          >
            <Select
              size="large"
              className="select-numerico"
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
            label="Cantidad de Personas" 
            name="cantidad_personas"
            style={{ flex: 1, marginBottom: 0 }}
          >
            <Select
              size="large"
              className="select-numerico"
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
        </div>

        <Form.Item
          label="Mozo"
          name="mozo_id"
          rules={[{ required: true, message: "Por favor seleccione un mozo" }]}
          style={{ marginBottom: "1.5rem" }}
        >
          <Select
            showSearch
            size="large"
            placeholder="Seleccionar mozo"
            disabled={esMesaExistente}
            filterOption={(input, option) =>
              (option?.children as unknown as string ?? "")
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          >
            {mozosActivos.map((mozo) => (
              <Select.Option key={mozo.id} value={mozo.id}>
                {mozo.nombre}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {!mostrarMozoApoyo && !esMesaExistente ? (
          <div style={{ textAlign: "right", marginTop: "-1rem", marginBottom: "1.5rem" }}>
            <Button 
              type="link" 
              onClick={() => setMostrarMozoApoyo(true)}
              style={{ padding: 0 }}
            >
              + Añadir mozo de apoyo
            </Button>
          </div>
        ) : mostrarMozoApoyo ? (
          <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", marginBottom: "1.5rem" }}>
            <Form.Item
              label="Mozo de Apoyo"
              name="mozo_id_2"
              style={{ flex: 1, marginBottom: 0 }}
            >
              <Select
                allowClear
                showSearch
                size="large"
                placeholder="Seleccionar mozo de apoyo"
                disabled={esMesaExistente}
                filterOption={(input, option) =>
                  (option?.children as unknown as string ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              >
                {mozosActivos
                  .filter(m => m.id !== mozo1Seleccionado)
                  .map((mozo) => (
                  <Select.Option key={mozo.id} value={mozo.id}>
                    {mozo.nombre}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Button
              type="text"
              danger
              onClick={() => {
                setMostrarMozoApoyo(false);
                form.setFieldValue("mozo_id_2", undefined);
              }}
              style={{ height: "40px" }}
            >
              Quitar
            </Button>
          </div>
        ) : null}

        <Divider>
          <Text type="secondary">Bebidas</Text>
        </Divider>

        <Form.List name="items">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }, index) => (
                <div
                  key={key}
                  style={{ display: "flex", width: "100%", gap: "8px", marginBottom: 8, alignItems: "center" }}
                >
                  <Form.Item
                    {...restField}
                    name={[name, "bebida_id"]}
                    rules={[{ required: true, message: "Seleccione bebida" }]}
                    style={{ flex: 1, minWidth: 0, marginBottom: 0 }}
                  >
                    <Select
                      showSearch
                      style={{ width: "100%" }}
                      popupMatchSelectWidth={false}
                      placeholder="Bebida"
                      filterOption={(input, option) =>
                        (option?.children as unknown as string ?? "")
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                    >
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
                    style={{ width: "55px", marginBottom: 0 }}
                  >
                    <InputNumber min={1} style={{ width: "100%" }} />
                  </Form.Item>

                  <Button
                    type="text"
                    danger
                    icon={<MinusCircleOutlined />}
                    onClick={() => remove(name)}
                    disabled={fields.length === 1 && index === 0}
                    style={{ padding: "0 4px", minWidth: 0 }}
                  />
                </div>
              ))}

              <div style={{ display: "flex", justifyContent: "center", marginTop: "0.5rem", marginBottom: "1rem" }}>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  icon={<PlusOutlined />}
                  title="Agregar Bebida"
                  size="large"
                  style={{
                    width: "80px",
                    backgroundColor: "rgba(255, 255, 255, 0.02)",
                    borderColor: "#1f2937",
                    color: "#94a3b8",
                  }}
                />
              </div>

            </>
          )}
        </Form.List>

        <Button
          type="primary"
          htmlType="submit"
          size="large"
          block
          loading={enviando}
          style={{
            height: "50px",
            fontSize: "1.1rem",
            marginTop: "1rem",
            width: "100%",
            fontWeight: "bold",
          }}
        >
          Registrar Comanda
        </Button>
      </Form>
      </div>
    </Card>
  );
}
