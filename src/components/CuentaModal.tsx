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
  Tooltip,
} from "antd";
import { DeleteOutlined, PlusOutlined, ThunderboltOutlined, PrinterOutlined } from "@ant-design/icons";
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
  const [mozoEditado2, setMozoEditado2] = useState<string | undefined>(undefined);
  const [metodoPago, setMetodoPago] = useState<string>("Efectivo");
  const [cobrando, setCobrando] = useState(false);
  const [bebidaExtraId, setBebidaExtraId] = useState<string | null>(null);

  const bebidas = useAppStore((state) => state.bebidas);
  const operacionesActivas = useAppStore((state) => state.operacionesActivas);
  const setOperacionesActivas = useAppStore(
    (state) => state.setOperacionesActivas,
  );
  const marcarTicketImpreso = useAppStore((state) => state.marcarTicketImpreso);
  const mozos = useAppStore((state) => state.mozos);

  const operacionActual = operacionesActivas.find(
    (op) => op.id === operacionId,
  );

  const esSegundaInstancia = operacionActual ? operacionesActivas.some(
    (op) => op.numero_mesa === operacionActual.numero_mesa && 
            op.id !== operacionActual.id &&
            new Date(op.creado_en).getTime() < new Date(operacionActual.creado_en).getTime()
  ) : false;

  const jornadaSeleccionada = useAppStore((state) => state.jornadaSeleccionada);
  const isJornadaCerrada = jornadaSeleccionada?.estado === "cerrada";
  const esModoMuseo = isJornadaCerrada;

  const estaPagada = operacionActual?.estado === "Pagada";
  const esSoloLectura = esModoMuseo || estaPagada;
  const mozoAsignado =
    mozos.find((m) => m.id === operacionActual?.mozo_id)?.nombre || "Sin mozo";

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
              setMozoEditado2(operacionActual?.mozo_id_2 || undefined);
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
      setMozoEditado2(undefined);
      setMetodoPago("Efectivo");
      setHayCambios(false);
      setIdsAEliminar([]);
    }

    return () => {
      isMounted = false;
    };
  }, [operacionId, visible]);

  const calcularCreditosRestantes = () => {
    if (esSegundaInstancia) return 0;
    if (!personasEditables) return 0;
    const creditosTotales = personasEditables; // 1 persona = 1 medio crédito
    let creditosGastados = 0;
    Object.values(bonificaciones).forEach((b) => {
      creditosGastados += b.b100 * 2 + b.b50 * 1;
    });
    return creditosTotales - creditosGastados;
  };

  const creditosRestantes = calcularCreditosRestantes();

  // Vigía de Integridad: Resetea bonificaciones si cambian las personas o la cantidad/volumen de items
  const firmaItems = items.map(i => `${i.id}-${i.cantidadEditable}`).join('|');
  const prevEstadoMesa = useRef({ personas: personasEditables, firma: firmaItems });
  const inicializado = useRef(false); // NUEVO ESCUDO

  useEffect(() => {
    // 1. Si está cerrado o cargando, bajamos el escudo y actualizamos la base
    if (!visible || loading) {
      inicializado.current = false; 
      prevEstadoMesa.current = { personas: personasEditables, firma: firmaItems };
      return;
    }

    // 2. Primer renderizado con los datos ya cargados (Hidratación)
    if (!inicializado.current) {
      prevEstadoMesa.current = { personas: personasEditables, firma: firmaItems };
      inicializado.current = true; // Levantamos el escudo
      return; // Cortamos la ejecución aquí para no disparar la alarma
    }

    // 3. A partir de aquí, cualquier cambio sí es intervención humana
    const cambioPersonas = prevEstadoMesa.current.personas !== personasEditables;
    const cambioItems = prevEstadoMesa.current.firma !== firmaItems;

    if (cambioPersonas || cambioItems) {
      const tieneBonificaciones = Object.values(bonificaciones).some(b => b.b100 > 0 || b.b50 > 0);
      if (tieneBonificaciones) {
        message.info("Consumos o comensales modificados. Las bonificaciones se han reiniciado por seguridad.");
      }
      setBonificaciones({});
      setHayCambios(true);
    }

    prevEstadoMesa.current = { personas: personasEditables, firma: firmaItems };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personasEditables, firmaItems, visible, loading]);

  const aplicarBonificacionesSugeridas = () => {
    if (esSegundaInstancia) {
      message.warning("Mesa en segunda ronda: El cupo de bonificaciones ya fue consumido en el ticket anterior.");
    }

    let creditos100 = esSegundaInstancia ? 0 : Math.floor(personasEditables / 2);
    let creditos50 = esSegundaInstancia ? 0 : (personasEditables % 2 === 1 ? 1 : 0);

    const nuevasBonificaciones: Record<string, { b100: number; b50: number }> = {};
    items.forEach(item => {
      nuevasBonificaciones[item.id] = { b100: 0, b50: 0 };
    });

    const unidadesDisponibles: { itemId: string; precio: number }[] = [];

    const itemsConBebida = items.map(item => ({
      ...item,
      bebida: bebidas.find(b => b.id === item.bebida_id)
    }));

    const bonificables = itemsConBebida
      .filter(item => item.bebida?.es_bonificable === true)
      .sort((a, b) => b.precio_unitario - a.precio_unitario);

    bonificables.forEach(item => {
      for (let i = 0; i < item.cantidadEditable; i++) {
        unidadesDisponibles.push({ itemId: item.id, precio: item.precio_unitario });
      }
    });

    for (let i = 0; i < unidadesDisponibles.length; i++) {
      const u = unidadesDisponibles[i];
      if (creditos100 > 0) {
        nuevasBonificaciones[u.itemId].b100 += 1;
        creditos100--;
        u.itemId = 'USADA';
      }
    }

    const restantes = unidadesDisponibles.filter(u => u.itemId !== 'USADA');
    if (creditos50 > 0 && restantes.length > 0) {
      nuevasBonificaciones[restantes[0].itemId].b50 += 1;
      creditos50--;
    }

    setBonificaciones(nuevasBonificaciones);
    setHayCambios(true);
    message.success("Bonificaciones sugeridas aplicadas");
  };

  const handleCantidadChange = (itemId: string, nuevaCantidad: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, cantidadEditable: nuevaCantidad }
          : item,
      ),
    );
    setHayCambios(true);
  };

  const handlePersonasChange = (val: number | null) => {
    const nuevasPersonas = val || 1;
    setPersonasEditables(nuevasPersonas);
    setHayCambios(true);
  };

  const handleEliminarItem = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
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

  const ejecutarGuardado = async (): Promise<boolean> => {
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
        return true;
      }

      const itemsAActualizar: any[] = [];
      const itemsAInsertar: any[] = [];

      items.forEach((item) => {
        if (item.id.startsWith("temp-")) {
          itemsAInsertar.push({
            operacion_id: operacionActual!.id,
            bebida_id: item.bebida_id,
            cantidad: item.cantidadEditable,
            precio_unitario: item.precio_unitario,
            cantidad_bonificada_100: bonificaciones[item.id]?.b100 || 0,
            cantidad_bonificada_50: bonificaciones[item.id]?.b50 || 0,
          });
        } else {
          itemsAActualizar.push({
            id: item.id,
            cantidad: item.cantidadEditable,
            cantidad_bonificada_100: bonificaciones[item.id]?.b100 || 0,
            cantidad_bonificada_50: bonificaciones[item.id]?.b50 || 0,
          });
        }
      });

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

        if (mozoEditado2 !== operacionActual.mozo_id_2) {
          payload.mozo_id_2 = mozoEditado2 === undefined ? null : mozoEditado2;
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

      await guardarCambiosCuenta(itemsAActualizar, idsAEliminar, itemsAInsertar);

      if (jornadaSeleccionada) {
        const dataRefrescada = await getOperacionesConItems(jornadaSeleccionada.id);
        setOperacionesActivas(dataRefrescada as any);
      }

      message.success("Cambios guardados correctamente");
      setHayCambios(false);
      setIdsAEliminar([]);
      return true;
    } catch (error: any) {
      console.error("Error al guardar:", error);
      message.error(error.message || "Error al guardar los cambios");
      return false;
    } finally {
      setGuardando(false);
    }
  };

  const handleGuardarCambios = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (operacionActual && mozoEditado && mozoEditado !== operacionActual.mozo_id) {
        const mozoViejo = mozos.find((m) => m.id === operacionActual.mozo_id)?.nombre || "Sin mozo";
        const mozoNuevo = mozos.find((m) => m.id === mozoEditado)?.nombre || "Sin mozo";

        Modal.confirm({
          title: "¿Transferir Mesa?",
          content: `¿Confirmas que quieres pasar esta mesa de ${mozoViejo} a ${mozoNuevo}?`,
          okText: "Sí, transferir",
          cancelText: "Cancelar",
          onOk: async () => {
            const result = await ejecutarGuardado();
            resolve(result);
          },
          onCancel: () => {
            resolve(false);
          }
        });
      } else {
        ejecutarGuardado().then(resolve);
      }
    });
  };

  const ejecutarConVigia = (accionCallback: () => void) => {
    if (!hayCambios) {
      accionCallback();
      return;
    }

    Modal.confirm({
      title: 'Tienes cambios sin guardar',
      content: '¿Deseas guardar los cambios en la cuenta antes de continuar?',
      okText: 'Guardar y Continuar',
      cancelText: 'Seguir editando',
      onOk: async () => {
        const exito = await handleGuardarCambios();
        if (exito !== false) {
          accionCallback();
        }
      }
    });
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

  const handleCobrar = async (metodoOpcional?: string) => {
    if (!operacionActual) return;
    const metodoDefinitivo = metodoOpcional || metodoPago;
    try {
      setCobrando(true);
      await cobrarOperacion(operacionActual.id, metodoDefinitivo, totalNeto);

      setOperacionesActivas(
        operacionesActivas.map((op) =>
          op.id === operacionActual.id
            ? {
                ...op,
                estado: "Pagada",
                metodo_pago: metodoDefinitivo as any,
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

  const handleAgregarExtra = () => {
    if (!bebidaExtraId || !operacionActual) return;
    
    const bebida = bebidas.find(b => b.id === bebidaExtraId);
    if (!bebida) return;
    
    const existente = items.find(i => i.bebida_id === bebida.id);
    
    if (existente) {
      setItems(prev => prev.map(item => 
        item.id === existente.id 
          ? { ...item, cantidadEditable: item.cantidadEditable + 1 }
          : item
      ));
    } else {
      const nuevoId = 'temp-' + Date.now();
      const nuevoItem = {
        id: nuevoId,
        bebida_id: bebida.id,
        cantidad: 0,
        cantidadEditable: 1,
        precio_unitario: bebida.precio_actual,
        creado_en: new Date().toISOString()
      };
      setItems(prev => [...prev, nuevoItem]);
    }
    
    setBebidaExtraId(null);
    setHayCambios(true);
    message.success(`${bebida.nombre} agregado a la cuenta localmente`);
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
      render: (val: string, record: any) => {
        const bebida = bebidas.find((b) => b.id === record.bebida_id);
        return (
          <Space>
            {val}
            {bebida?.es_bonificable && (
              <span title="Bonificable">✨</span>
            )}
          </Space>
        );
      },
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
      render: (_: any, record: any) => {
        const val = bonificaciones[record.id]?.b100 || 0;
        return esSoloLectura ? (
          val > 0 ? (
            <Tag color="blue" style={{ fontSize: '14px', margin: 0, minWidth: '32px', textAlign: 'center' }}>
              {val}
            </Tag>
          ) : (
            <Typography.Text type="secondary">{val}</Typography.Text>
          )
        ) : (
          <InputNumber
            min={0}
            value={val}
            style={val > 0 ? { borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.2)' } : {}}
            onChange={(v) =>
              handleBonifChange(record.id, "b100", v || 0, record.cantidadEditable)
            }
          />
        );
      },
    },
    {
      title: "Bonif. 50%",
      key: "cantidad_bonificada_50",
      width: 100,
      render: (_: any, record: any) => {
        const val = bonificaciones[record.id]?.b50 || 0;
        return esSoloLectura ? (
          val > 0 ? (
            <Tag color="blue" style={{ fontSize: '14px', margin: 0, minWidth: '32px', textAlign: 'center' }}>
              {val}
            </Tag>
          ) : (
            <Typography.Text type="secondary">{val}</Typography.Text>
          )
        ) : (
          <InputNumber
            min={0}
            value={val}
            style={val > 0 ? { borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.2)' } : {}}
            onChange={(v) =>
              handleBonifChange(record.id, "b50", v || 0, record.cantidadEditable)
            }
          />
        );
      },
    },
    {
      title: "P. Unit.",
      dataIndex: "precio_unitario",
      key: "precio_unitario",
      render: (val: number) => `$${Math.round(val).toLocaleString("es-AR")}`,
    },
    {
      title: "Subtotal",
      dataIndex: "subtotal",
      key: "subtotal",
      render: (val: number) => <strong>${Math.round(val).toLocaleString("es-AR")}</strong>,
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
      title={<Typography.Title level={4}>Mesa {operacionActual?.numero_mesa}</Typography.Title>}
      open={visible}
      onCancel={() => ejecutarConVigia(onClose)}
      width={800}
      style={{ top: 20 }}
      footer={
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%", gap: "1rem", flexWrap: "wrap", marginTop: "1rem" }}>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {esSoloLectura ? (
              <Button icon={<PrinterOutlined />} onClick={() => ejecutarConVigia(() => { operacionActual && marcarTicketImpreso(operacionActual.id); handlePrintA4(); })} disabled={cobrando}>
                Imprimir Ticket
              </Button>
            ) : (
              <>
                <Button icon={<PrinterOutlined />} onClick={() => ejecutarConVigia(() => { operacionActual && marcarTicketImpreso(operacionActual.id); handlePrintA4(); })} disabled={cobrando}>
                  Imprimir Ticket
                </Button>
                {!estaPagada && !isJornadaCerrada && !hayCambios && (
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
                )}
              </>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end" }}>
            {esSoloLectura ? (
              <>
                {estaPagada && !isJornadaCerrada && (
                  <Button danger type="dashed" onClick={handleReabrirCuenta}>
                    Anular Pago y Reabrir
                  </Button>
                )}
              </>
            ) : hayCambios ? (
              <Button
                type="primary"
                loading={guardando}
                onClick={handleGuardarCambios}
              >
                Guardar Cambios
              </Button>
            ) : (
              <>
                {!estaPagada && !isJornadaCerrada && (
                  <>
                    {totalNeto === 0 && operacionActual?.estado === "Abierta" ? (
                    <Button
                      type="primary"
                      loading={cobrando}
                      onClick={() => handleCobrar("Bonificación 100%")}
                      style={{ width: "100%" }}
                    >
                      Cerrar Cuenta (100% Bonificada)
                    </Button>
                    ) : (
                      <>
                        <Space.Compact>
                          <Select
                            value={metodoPago}
                            onChange={setMetodoPago}
                            disabled={cobrando}
                            style={{ width: "130px", textAlign: "center" }}
                            options={[
                              { value: "Efectivo", label: "Efectivo" },
                              { value: "QR", label: "MercadoPago/QR" },
                              { value: "Debito", label: "Débito" },
                              { value: "Incobrable", label: "Incobrable" },
                            ]}
                          />
                          <Button
                            type="primary"
                            danger
                            loading={cobrando}
                            onClick={() => {
                              if (metodoPago === "Incobrable") {
                                Modal.confirm({
                                  title: '¿Marcar mesa como Incobrable?',
                                  content: 'La mesa se cerrará y el importe se registrará como pérdida (Incobrable).',
                                  okText: 'Sí, registrar pérdida',
                                  okType: 'danger',
                                  cancelText: 'Cancelar',
                                  onOk: () => handleCobrar('Incobrable')
                                });
                              } else {
                                handleCobrar();
                              }
                            }}
                          >
                            Cobrar y Cerrar
                          </Button>
                        </Space.Compact>
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      }
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <Spin />
        </div>
      ) : (
        <Space direction="vertical" style={{ width: "100%" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "16px", width: "100%", marginBottom: "16px" }}>
            {operacionActual && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Typography.Text style={{ whiteSpace: "nowrap" }}>Personas:</Typography.Text>
                {esSoloLectura ? (
                  <Typography.Text strong>{personasEditables}</Typography.Text>
                ) : (
                  <InputNumber
                    min={1}
                    value={personasEditables}
                    onChange={handlePersonasChange}
                  />
                )}
              </div>
            )}
            {operacionActual && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Typography.Text style={{ whiteSpace: "nowrap" }}>Mozo:</Typography.Text>
                <Select
                  value={mozoEditado}
                  disabled={esSoloLectura}
                  onChange={(val) => {
                    setMozoEditado(val);
                    setHayCambios(true);
                  }}
                  style={{ minWidth: 120, width: "100%" }}
                  options={mozos
                    .filter((m) => m.activo !== false)
                    .map((m) => ({
                      value: m.id,
                      label: m.nombre,
                    }))}
                />
              </div>
            )}
            {operacionActual && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Typography.Text style={{ whiteSpace: "nowrap" }}>Mozo 2:</Typography.Text>
                <Select
                  value={mozoEditado2}
                  disabled={esSoloLectura}
                  onChange={(val) => {
                    setMozoEditado2(val);
                    setHayCambios(true);
                  }}
                  allowClear
                  placeholder="Sin Apoyo"
                  style={{ minWidth: 120, width: "100%" }}
                  options={mozos
                    .filter((m) => m.activo !== false && m.id !== mozoEditado)
                    .map((m) => ({
                      value: m.id,
                      label: m.nombre,
                    }))}
                />
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginLeft: "auto", flexWrap: "wrap" }}>
              <Tag color="blue" style={{ fontSize: "14px", padding: "4px 8px", margin: 0 }}>
                Bonificaciones Restantes: {creditosRestantes / 2}
              </Tag>
              {items.some(item => bebidas.find(b => b.id === item.bebida_id)?.es_bonificable) && (
                <Tooltip title={esSegundaInstancia ? "Segunda instancia: sin cupo" : ""}>
                  <Button
                    type="dashed"
                    icon={<ThunderboltOutlined />}
                    onClick={aplicarBonificacionesSugeridas}
                    disabled={esSoloLectura || (!esSegundaInstancia && creditosRestantes <= 0)}
                    danger={esSegundaInstancia}
                  >
                    Aplicar Sugeridas
                  </Button>
                </Tooltip>
              )}
            </div>
          </div>
          <Table
            columns={columnasFinales}
            dataSource={dataSource}
            pagination={false}
            size="small"
          />
          <Divider />
          {operacionActual?.estado === 'Abierta' && (
            <div style={{ padding: '12px', backgroundColor: '#0f2238', borderRadius: '8px', marginBottom: '16px', display: 'flex', gap: '8px' }}>
              <Select
                showSearch
                style={{ flex: 1 }}
                placeholder="Agregar producto..."
                value={bebidaExtraId}
                onChange={setBebidaExtraId}
                filterOption={(input, option) =>
                  (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                }
                options={bebidas.map(b => ({ 
                  value: b.id, 
                  label: `${b.nombre} ${b.es_bonificable ? '✨' : ''} ($${Math.round(b.precio_actual).toLocaleString("es-AR")})` 
                }))}
              />
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={handleAgregarExtra}
                disabled={!bebidaExtraId}
              >
                Agregar
              </Button>
            </div>
          )}
          <Typography.Title level={3} style={{ textAlign: "right", margin: 0 }}>
            Total: ${Math.round(totalNeto).toLocaleString("es-AR")}
          </Typography.Title>
        </Space>
      )}

      {/* Componente Oculto para Impresión */}
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
