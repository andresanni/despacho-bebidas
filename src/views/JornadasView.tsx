import { useState, useEffect } from "react";
import { Table, Button, Typography, Space, Tag, message, Card } from "antd";
import { PlusOutlined, EyeOutlined, LoginOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import { supabase } from "../lib/supabase";
import { create } from "../services/baseService";
import type { Jornada } from "../types";

const { Title, Text } = Typography;

export function JornadasView() {
  const navigate = useNavigate();
  const jornadaActiva = useAppStore((state) => state.jornadaActiva);
  const setJornadaActiva = useAppStore((state) => state.setJornadaActiva);
  const setJornadaSeleccionada = useAppStore(
    (state) => state.setJornadaSeleccionada,
  );

  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [loading, setLoading] = useState(true);
  const [creando, setCreando] = useState(false);

  useEffect(() => {
    fetchJornadas();
  }, []);

  const fetchJornadas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("jornadas")
        .select("*")
        .order("creado_en", { ascending: false });

      if (error) throw error;
      setJornadas(data || []);
    } catch (error: any) {
      console.error("Error cargando jornadas:", error);
      message.error("No se pudo cargar el historial de jornadas");
    } finally {
      setLoading(false);
    }
  };

  const handleAbrirJornada = async () => {
    try {
      setCreando(true);
      const nuevaJornada = await create<Jornada>("jornadas", {
        estado: "abierta",
      });
      // Setea globalmente para bloquear futuras creaciones
      setJornadaActiva(nuevaJornada);
      // Recarga la lista local
      await fetchJornadas();
      message.success("Nueva jornada iniciada con éxito");
    } catch (error: any) {
      console.error("Error abriendo jornada:", error);
      message.error("Error al iniciar la jornada");
    } finally {
      setCreando(false);
    }
  };

  const handleEntrarJornada = (jornada: Jornada) => {
    setJornadaSeleccionada(jornada);
    navigate("/despacho");
  };

  const columns = [
    {
      title: "Identificador",
      dataIndex: "id",
      key: "id",
      render: (id: string) => <Text type="secondary">{id.split("-")[0]}</Text>,
    },
    {
      title: "Fecha de Apertura",
      dataIndex: "creado_en",
      key: "creado_en",
      render: (val: string) => new Date(val).toLocaleString(),
    },
    {
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      render: (estado: string) => (
        <Tag 
          style={estado === "abierta" 
            ? { backgroundColor: "#064e3b", color: "#34d399", border: "1px solid #059669" }
            : { backgroundColor: "#1e293b", color: "#94a3b8", border: "1px solid #334155" }
          }
        >
          {estado.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Acción",
      key: "accion",
      render: (_: any, record: Jornada) => (
        <Button
          type={record.estado === "abierta" ? "primary" : "default"}
          icon={
            record.estado === "abierta" ? <LoginOutlined /> : <EyeOutlined />
          }
          onClick={() => handleEntrarJornada(record)}
        >
          {record.estado === "abierta" ? "Entrar (Operar)" : "Ver Detalle"}
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
            Historial de Recaudaciones
          </Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAbrirJornada}
            loading={creando}
            disabled={!!jornadaActiva}
          >
            Abrir Nueva Jornada
          </Button>
        </Space>

        <Table
          dataSource={jornadas}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          size="middle"
        />
      </Card>
    </div>
  );
}
