import { useState, useEffect, useRef } from "react";
import {
  Modal,
  Typography,
  Table,
  Spin,
  message,
  Space,
  Divider,
  Button,
  InputNumber,
  Tag,
  Select,
  Popconfirm,
} from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { useReactToPrint } from "react-to-print";
import { supabase } from "../lib/supabase";
import { useAppStore } from "../store/useAppStore";
import {
  guardarCambiosCuenta,
  cobrarOperacion,
  eliminarOperacion,
  getOperacionesConItems,
  anularPagoYReabrir,
} from "../services/operacionesService";
import { TicketImpresion } from "./TicketImpresion";
import { TicketA4 } from "./TicketA4";

interface CuentaModalProps {
  operacionId: string | null;
  visible: boolean;
  onClose: () => void;
}

export function CuentaModal({
  operacionId,
  visible,
  onClose,
}: CuentaModalProps) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [bonificaciones, setBonificaciones] = useState<
    Record<string, { b100: number; b50: number }>
  >({});

  const [hayCambios, setHayCambios] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [idsAEliminar, setIdsAEliminar] = useState<string[]>([]);
  const [personasEditables, setPersonasEditables] = useState<number>(0);
  const [mozoEditado, setMozoEditado] = useState<string | undefined>(undefined);
  const [metodoPago, setMetodoPago] = useState<string>("Efectivo");
  const [cobrando, setCobrando] = useState(false);

  const bebidas = useAppStore((state) => state.bebidas);
  const operacionesActivas = useAppStore((state) => state.operacionesActivas);
  const setOperacionesActivas = useAppStore(
    (state) => state.setOperacionesActivas,
  );
  const mozos = useAppStore((state) => state.mozos);

  const operacionActual = operacionesActivas.find(
    (op) => op.id === operacionId,
  );
  const jornadaSeleccionada = useAppStore((state) => state.jornadaSeleccionada);
  const isJornadaCerrada = jornadaSeleccionada?.estado === "cerrada";
  const esModoMuseo = isJornadaCerrada;

  const estaPagada = operacionActual?.estado === "Pagada";
  const esSoloLectura = esModoMuseo || estaPagada;
  const mozoAsignado =
    mozos.find((m) => m.id === operacionActual?.mozo_id)?.nombre || "Sin mozo";

  const componentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Ticket_Comandera_${operacionActual?.numero_mesa || "x"}`,
  });

  const ticketA4Ref = useRef<HTMLDivElement>(null);
  const handlePrintA4 = useReactToPrint({
    contentRef: ticketA4Ref,
    documentTitle: `Ticket_A4_${operacionActual?.numero_mesa || "x"}`,
  });

  useEffect(() => {
    let isMounted = true;

    if (visible && operacionId) {
      setLoading(true);
      const fetchItems = async () => {
        try {
          const { data, error } = await supabase
            .from("items_operacion")
            .select("*")
            .eq("operacion_id", operacionId)
            .order("creado_en", { ascending: true });

          if (error) throw error;

          if (isMounted) {
            const dataMapeada = (data || []).map((item) => ({
              ...item,
              cantidadEditable: item.cantidad,
            }));
            setItems(dataMapeada);
            if (data) {
              const inicial: Record<string, { b100: number; b50: number }> = {};
              data.forEach((item: any) => {
                inicial[item.id] = {
                  b100: item.cantidad_bonificada_100,
                  b50: item.cantidad_bonificada_50,
                };
              });
              setBonificaciones(inicial);
              setPersonasEditables(operacionActual?.cantidad_personas || 0);
              setMozoEditado(operacionActual?.mozo_id || undefined);
              setMetodoPago("Efectivo");
              setHayCambios(false);
              setIdsAEliminar([]);
            }
          }
        } catch (error: any) {
          if (isMounted) {
            console.error("Error fetching items:", error);
            message.error(
              error.message || "No se pudieron cargar los ítems de la cuenta",
            );
          }
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      };

      fetchItems();
    } else {
      setItems([]);
      setBonificaciones({});
      setPersonasEditables(0);
      setMozoEditado(undefined);
      setMetodoPago("Efectivo");
      setHayCambios(false);
      setIdsAEliminar([]);
    }

    return () => {
      isMounted = false;
    };
  }, [operacionId, visible]);

  const calcularCreditosRestantes = () => {
    if (!personasEditables) return 0;
    const creditosTotales = personasEditables; // 1 persona = 1 medio crédito
    let creditosGastados = 0;
    Object.values(bonificaciones).forEach((b) => {
      creditosGastados += b.b100 * 2 + b.b50 * 1;
    });
    return creditosTotales - creditosGastados;
  };

  const creditosRestantes = calcularCreditosRestantes();

  const handleCantidadChange = (itemId: string, nuevaCantidad: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, cantidadEditable: nuevaCantidad }
          : item,
      ),
    );
    setBonificaciones({});
    message.info(
      "Cantidades modificadas. Las bonificaciones se han reiniciado.",
    );
    setHayCambios(true);
  };

  const handlePersonasChange = (val: number | null) => {
    const nuevasPersonas = val || 1;
    setPersonasEditables(nuevasPersonas);
    setBonificaciones({});
    message.info(
      "Comensales modificados. Las bonificaciones se han reiniciado.",
    );
    setHayCambios(true);
  };

  const handleEliminarItem = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
    setBonificaciones((prev) => {
      const nuevas = { ...prev };
      delete nuevas[itemId];
      return nuevas;
    });
    setIdsAEliminar((prev) => [...prev, itemId]);
    setHayCambios(true);
  };

  const handleBonifChange = (
    itemId: string,
    tipo: "b100" | "b50",
    valorNuevo: number,
    cantidadTotalItem: number,
  ) => {
    setBonificaciones((prev) => {
      const actual = prev[itemId] || { b100: 0, b50: 0 };
      const otroTipo = tipo === "b100" ? actual.b50 : actual.b100;

      if (valorNuevo + otroTipo > cantidadTotalItem) return prev;

      const diferencia = valorNuevo - actual[tipo];
      const costoCreditos = tipo === "b100" ? diferencia * 2 : diferencia * 1;
      if (creditosRestantes - costoCreditos < 0) {
        message.warning("No tienes suficientes créditos de bonificación");
        return prev;
      }

      setHayCambios(true);
      return { ...prev, [itemId]: { ...actual, [tipo]: valorNuevo } };
    });
  };

  const ejecutarGuardado = async () => {
    try {
      setGuardando(true);

      if (items.length === 0 && operacionActual) {
        await eliminarOperacion(operacionActual.id);

        setOperacionesActivas(
          operacionesActivas.filter((op) => op.id !== operacionActual.id),
        );

        message.info("Mesa anulada por quedar sin consumos.");
        setHayCambios(false);
        setIdsAEliminar([]);
        onClose();
        return;
      }

      const itemsAActualizar = items.map((item) => ({
        id: item.id,
        cantidad: item.cantidadEditable,
        cantidad_bonificada_100: bonificaciones[item.id]?.b100 || 0,
        cantidad_bonificada_50: bonificaciones[item.id]?.b50 || 0,
      }));

      if (operacionActual) {
        const payload: any = {};
        let updateOp = false;

        if (personasEditables !== operacionActual.cantidad_personas) {
          payload.cantidad_personas = personasEditables;
          updateOp = true;
        }

        if (mozoEditado && mozoEditado !== operacionActual.mozo_id) {
          payload.mozo_id = mozoEditado;
          updateOp = true;
        }

        if (updateOp) {
          const { error: opError } = await supabase
            .from("operaciones")
            .update(payload)
            .eq("id", operacionActual.id);
          if (opError) throw opError;

          // 2. LA CLAVE DE LA REACTIVIDAD: Actualizar el estado global
          setOperacionesActivas(
            operacionesActivas.map((op) =>
              op.id === operacionActual.id
                ? { ...op, ...payload }
                : op
            )
          );
        }
      }

      await guardarCambiosCuenta(itemsAActualizar, idsAEliminar);

      if (jornadaSeleccionada) {
        const dataRefrescada = await getOperacionesConItems(jornadaSeleccionada.id);
        setOperacionesActivas(dataRefrescada as any);
      }

      message.success("Cambios guardados correctamente");
      setHayCambios(false);
      setIdsAEliminar([]);
    } catch (error: any) {
      console.error("Error al guardar:", error);
      message.error(error.message || "Error al guardar los cambios");
    } finally {
      setGuardando(false);
    }
  };

  const handleGuardarCambios = () => {
    if (operacionActual && mozoEditado && mozoEditado !== operacionActual.mozo_id) {
      const mozoViejo = mozos.find((m) => m.id === operacionActual.mozo_id)?.nombre || "Sin mozo";
      const mozoNuevo = mozos.find((m) => m.id === mozoEditado)?.nombre || "Sin mozo";

      Modal.confirm({
        title: "¿Transferir Mesa?",
        content: `¿Confirmas que quieres pasar esta mesa de ${mozoViejo} a ${mozoNuevo}?`,
        okText: "Sí, transferir",
        cancelText: "Cancelar",
        onOk: ejecutarGuardado,
      });
    } else {
      ejecutarGuardado();
    }
  };

  const handleAnularMesa = async () => {
    if (!operacionActual) return;
    try {
      // Reutilizamos la función de la guillotina
      await eliminarOperacion(operacionActual.id);

      // Actualizamos el estado global para sacarla del mapa
      setOperacionesActivas(
        operacionesActivas.filter((op) => op.id !== operacionActual.id),
      );

      message.success("Mesa anulada correctamente");
      onClose();
    } catch (error: any) {
      console.error("Error al anular:", error);
      message.error("No se pudo anular la mesa");
    }
  };

  const handleCobrar = async () => {
    if (!operacionActual) return;
    try {
      setCobrando(true);
      await cobrarOperacion(operacionActual.id, metodoPago, totalNeto);

      setOperacionesActivas(
        operacionesActivas.map((op) =>
          op.id === operacionActual.id
            ? {
                ...op,
                estado: "Pagada",
                metodo_pago: metodoPago as any,
                total_neto: totalNeto,
              }
            : op,
        ),
      );

      message.success("Mesa cobrada y cerrada exitosamente");
      onClose();
    } catch (error: any) {
      console.error("Error al cobrar:", error);
      message.error(error.message || "Error al intentar cobrar la mesa");
    } finally {
      setCobrando(false);
    }
  };

  const dataSource = items.map((item) => {
    const bebida = bebidas.find((b) => b.id === item.bebida_id);
    const itemBonif = bonificaciones[item.id] || { b100: 0, b50: 0 };
    const cantidadPagable =
      item.cantidadEditable - itemBonif.b100 - itemBonif.b50 * 0.5;
    const subtotal = cantidadPagable * item.precio_unitario;
    const subtotalBruto = item.cantidadEditable * item.precio_unitario;

    return {
      ...item,
      key: item.id,
      bebidaNombre: bebida?.nombre || "Desconocida",
      subtotal,
      subtotalBruto,
      b100: itemBonif.b100,
      b50: itemBonif.b50,
    };
  });

  const totalNeto = dataSource.reduce((acc, curr) => acc + curr.subtotal, 0);
  const totalBruto = dataSource.reduce(
    (acc, curr) => acc + curr.subtotalBruto,
    0,
  );
  const totalDescuentos = totalBruto - totalNeto;

  const columns = [
    {
      title: "Bebida",
      dataIndex: "bebidaNombre",
      key: "bebidaNombre",
    },
    {
      title: "Cant.",
      dataIndex: "cantidadEditable",
      key: "cantidad",
      width: 80,
      render: (_: any, record: any) =>
        esSoloLectura ? (
          <Typography.Text>{record.cantidadEditable}</Typography.Text>
        ) : (
          <InputNumber
            min={1}
            value={record.cantidadEditable}
            onChange={(val) => handleCantidadChange(record.id, val || 1)}
          />
        ),
    },
    {
      title: "Bonif. 100%",
      key: "cantidad_bonificada_100",
      width: 100,
      render: (_: any, record: any) =>
        esSoloLectura ? (
          <Typography.Text>
            {bonificaciones[record.id]?.b100 || 0}
          </Typography.Text>
        ) : (
          <InputNumber
            min={0}
            value={bonificaciones[record.id]?.b100 || 0}
            onChange={(val) =>
              handleBonifChange(
                record.id,
                "b100",
                val || 0,
                record.cantidadEditable,
              )
            }
          />
        ),
    },
    {
      title: "Bonif. 50%",
      key: "cantidad_bonificada_50",
      width: 100,
      render: (_: any, record: any) =>
        esSoloLectura ? (
          <Typography.Text>
            {bonificaciones[record.id]?.b50 || 0}
          </Typography.Text>
        ) : (
          <InputNumber
            min={0}
            value={bonificaciones[record.id]?.b50 || 0}
            onChange={(val) =>
              handleBonifChange(
                record.id,
                "b50",
                val || 0,
                record.cantidadEditable,
              )
            }
          />
        ),
    },
    {
      title: "P. Unit.",
      dataIndex: "precio_unitario",
      key: "precio_unitario",
      render: (val: number) => `$${val.toFixed(2)}`,
    },
    {
      title: "Subtotal",
      dataIndex: "subtotal",
      key: "subtotal",
      render: (val: number) => <strong>${val.toFixed(2)}</strong>,
    },
    {
      title: "",
      key: "acciones",
      width: 50,
      render: (_: any, record: any) => (
        <Button
          type="text"
          danger
          disabled={esSoloLectura}
          icon={<DeleteOutlined />}
          onClick={() => handleEliminarItem(record.id)}
        />
      ),
    },
  ];

  const columnasFinales = columns.filter(
    (col) => !esSoloLectura || col.key !== "acciones",
  );

  const handleReabrirCuenta = () => {
    Modal.confirm({
      title: '¿Anular Pago y Reabrir Mesa?',
      content: 'Esto eliminará el registro del cobro de la caja y la mesa volverá a aparecer como pendiente de pago. ¿Estás seguro?',
      okText: 'Sí, Reabrir',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        if (!operacionActual || !jornadaSeleccionada) return;
        try {
          await anularPagoYReabrir(operacionActual.id);
          // Re-fetch para reactividad global
          const dataRefrescada = await getOperacionesConItems(jornadaSeleccionada.id);
          setOperacionesActivas(dataRefrescada as any);
          message.success('Pago anulado. Mesa reabierta.');
          onClose(); // Cerramos el modal
        } catch (error: any) {
          message.error('Error al reabrir la mesa: ' + error.message);
        }
      }
    });
  };

  return (
    <Modal
      title={<Typography.Title level={4}>Detalle de Cuenta</Typography.Title>}
      open={visible}
      onCancel={onClose}
      width={800}
      footer={
        <Space>
          {esSoloLectura ? (
            <>
              {estaPagada && !isJornadaCerrada && (
                <Button danger type="dashed" onClick={handleReabrirCuenta}>
                  Anular Pago y Reabrir
                </Button>
              )}
              <Button onClick={handlePrint} disabled={cobrando}>
                Imprimir Comandera
              </Button>
              <Button onClick={handlePrintA4} disabled={cobrando}>
                Imprimir (Láser A4)
              </Button>
            </>
          ) : hayCambios ? (
            <Button
              type="primary"
              style={{ backgroundColor: "#d97706", borderColor: "#d97706" }}
              loading={guardando}
              onClick={handleGuardarCambios}
            >
              Guardar Cambios
            </Button>
          ) : (
            <>
              <Button onClick={handlePrint} disabled={cobrando}>
                Imprimir Comandera
              </Button>
              <Button onClick={handlePrintA4} disabled={cobrando} style={{ marginRight: '8px' }}>
                Imprimir (Láser A4)
              </Button>
              {!estaPagada && !isJornadaCerrada && (
                <>
                  <Popconfirm
                    title="¿Anular mesa?"
                    description="Se eliminará la comanda completa. Esta acción no se puede deshacer."
                    onConfirm={handleAnularMesa}
                    okText="Sí, Anular"
                    cancelText="Cancelar"
                    okButtonProps={{ danger: true }}
                  >
                    <Button danger disabled={cobrando}>
                      Anular Mesa
                    </Button>
                  </Popconfirm>
                  <Space.Compact>
                    <Select
                      value={metodoPago}
                      onChange={setMetodoPago}
                      disabled={cobrando}
                      style={{ width: "120px" }}
                      options={[
                        { value: "Efectivo", label: "Efectivo" },
                        { value: "QR", label: "MercadoPago/QR" },
                        { value: "Debito", label: "Débito" },
                      ]}
                    />
                    <Button
                      type="primary"
                      danger
                      loading={cobrando}
                      onClick={handleCobrar}
                    >
                      Cobrar y Cerrar
                    </Button>
                  </Space.Compact>
                </>
              )}
            </>
          )}
        </Space>
      }
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <Spin />
        </div>
      ) : (
        <Space direction="vertical" style={{ width: "100%" }}>
          <Space size="large">
            {operacionActual && (
              <Space>
                <Typography.Text>Personas:</Typography.Text>
                {esSoloLectura ? (
                  <Typography.Text strong>{personasEditables}</Typography.Text>
                ) : (
                  <InputNumber
                    min={1}
                    value={personasEditables}
                    onChange={handlePersonasChange}
                  />
                )}
              </Space>
            )}
            {operacionActual && (
              <Space>
                <Typography.Text>Mozo:</Typography.Text>
                <Select
                  value={mozoEditado}
                  disabled={esSoloLectura}
                  onChange={(val) => {
                    setMozoEditado(val);
                    setHayCambios(true);
                  }}
                  style={{ width: 150 }}
                  options={mozos
                    .filter((m) => m.activo !== false)
                    .map((m) => ({
                      value: m.id,
                      label: m.nombre,
                    }))}
                />
              </Space>
            )}
            <Tag color="blue" style={{ fontSize: "14px", padding: "4px 8px" }}>
              Bonificaciones Restantes: {creditosRestantes / 2}
            </Tag>
          </Space>

          <Table
            columns={columnasFinales}
            dataSource={dataSource}
            pagination={false}
            size="small"
          />
          <Divider />
          <Typography.Title level={3} style={{ textAlign: "right" }}>
            Total: ${totalNeto.toFixed(2)}
          </Typography.Title>
        </Space>
      )}

      {/* Componente Oculto para Impresión */}
      <TicketImpresion
        ref={componentRef}
        operacion={operacionActual}
        mozoNombre={mozoAsignado}
        itemsCalculados={dataSource}
        totalBruto={totalBruto}
        totalDescuentos={totalDescuentos}
        totalNeto={totalNeto}
      />
      <TicketA4
        ref={ticketA4Ref}
        operacion={operacionActual}
        mozoNombre={mozoAsignado}
        itemsCalculados={dataSource}
        totalBruto={totalBruto}
        totalDescuentos={totalDescuentos}
        totalNeto={totalNeto}
      />
    </Modal>
  );
}
