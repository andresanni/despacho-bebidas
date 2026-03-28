import { forwardRef } from "react";
import type { Operacion } from "../types";

interface TicketA4Props {
  operacion: Operacion | undefined;
  mozoNombre: string;
  itemsCalculados: any[];
  totalBruto: number;
  totalDescuentos: number;
  totalNeto: number;
}

export const TicketA4 = forwardRef<HTMLDivElement, TicketA4Props>(
  (
    {
      operacion,
      mozoNombre,
      itemsCalculados,
      totalBruto,
      totalDescuentos,
      totalNeto,
    },
    ref,
  ) => {
    if (!operacion || itemsCalculados.length === 0) return null;

    return (
      <div style={{ display: "none" }}>
        <div
          ref={ref}
          style={{
            padding: "0 20px 20px 20px", // Reducido el padding superior
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            color: "#000",
            backgroundColor: "#fff",
            maxWidth: "210mm",
            margin: "0 auto",
          }}
        >
          <style>
            {`
              @media print {
                body {
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                  background-color: transparent !important;
                }
                @page {
                  size: A4;
                  margin: 5mm 20mm 20mm 20mm; /* Minimal top margin */
                }
              }
              .ticket-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
                margin-bottom: 20px;
              }
              .ticket-table th, .ticket-table td {
                border: 1px solid #ddd;
                padding: 4px 8px; /* Padding reducido para compresión */
                text-align: left;
                font-size: 14px;
              }
              .ticket-table th {
                background-color: #f8f9fa !important;
                font-weight: bold;
              }
              .ticket-table .text-right {
                text-align: right;
              }
              .ticket-table .text-center {
                text-align: center;
              }
            `}
          </style>

          {/* Tira Horizontal Unificada de Cabecera */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              border: "1px solid #ddd",
              padding: "8px 16px",
              marginBottom: "12px",
              backgroundColor: "#f9f9f9",
              borderRadius: "4px",
            }}
          >
            <div style={{ marginRight: '24px' }}>
              <h1 style={{ margin: "0 0 2px 0", fontSize: "24px" }}>
                Maria Gracia
              </h1>
              <p style={{ margin: 0, color: "#666", fontSize: "12px" }}>
                Consumo de bebidas ({new Date(operacion.creado_en).toLocaleString("es-AR")})
              </p>
            </div>
            
            <div style={{ display: "flex", gap: "24px", fontSize: "16px", flexShrink: 0 }}>
              <div style={{ textAlign: "center" }}>
                <span style={{ color: "#666", fontSize: "12px", display: "block" }}>MESA</span>
                <strong style={{ fontSize: "20px" }}>{operacion.numero_mesa}</strong>
              </div>
              <div style={{ textAlign: "center" }}>
                <span style={{ color: "#666", fontSize: "12px", display: "block" }}>PERSONAS</span>
                <strong>{operacion.cantidad_personas || "-"}</strong>
              </div>
              <div style={{ textAlign: "center" }}>
                <span style={{ color: "#666", fontSize: "12px", display: "block" }}>MOZO</span>
                <strong>{mozoNombre}</strong>
              </div>
            </div>
          </div>

          {/* Tabla Desglose */}
          <table className="ticket-table">
            <thead>
              <tr>
                <th className="text-center" style={{ width: "8%" }}>
                  Cant.
                </th>
                <th style={{ width: "37%" }}>Descripción</th>
                <th className="text-center" style={{ width: "20%" }}>
                  Cant. Bonif.
                </th>
                <th className="text-right" style={{ width: "15%" }}>
                  P. Unit
                </th>
                <th className="text-right" style={{ width: "20%" }}>
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody>
              {itemsCalculados.map((item) => {
                let textoBonif = "-";
                const b100 = item.b100 || 0;
                const b50 = item.b50 || 0;

                if (b100 > 0 && b50 > 0) {
                  textoBonif = `${b100} (100%), ${b50} (50%)`;
                } else if (b100 > 0) {
                  textoBonif = `${b100} (100%)`;
                } else if (b50 > 0) {
                  textoBonif = `${b50} (50%)`;
                }

                return (
                  <tr key={item.id}>
                    <td className="text-center">{item.cantidadEditable}</td>
                    <td>{item.bebidaNombre}</td>
                    <td className="text-center" style={{ color: textoBonif !== "-" ? "#d9534f" : "inherit" }}>
                      {textoBonif}
                    </td>
                    <td className="text-right">
                      ${Math.round(item.precio_unitario).toLocaleString("es-AR")}
                    </td>
                    <td className="text-right">
                      ${Math.round(item.subtotalBruto).toLocaleString("es-AR")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Resumen Final y Mensajes en Footer Combinado */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginTop: "12px",
            }}
          >
            {/* Mensajes Legales (Izquierda) */}
            <div
              style={{
                color: "#666",
                fontSize: "11px",
              }}
            >
              <p style={{ margin: "0 0 4px 0" }}>Muchas gracias por su visita.</p>
              <p style={{ margin: 0 }}>COMPROBANTE NO VÁLIDO COMO FACTURA</p>
            </div>

            {/* Totales Matemáticos (Derecha) */}
            <div style={{ width: "45%" }}>
              <table style={{ width: "100%", fontSize: "14px", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ padding: "4px 0" }}>Subtotal:</td>
                    <td style={{ textAlign: "right", padding: "4px 0" }}>
                      ${Math.round(totalBruto).toLocaleString("es-AR")}
                    </td>
                  </tr>
                  {totalDescuentos > 0 && (
                    <tr>
                      <td style={{ padding: "4px 0", color: "#d9534f" }}>
                        Bonificaciones:
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          padding: "4px 0",
                          color: "#d9534f",
                        }}
                      >
                        -${Math.round(totalDescuentos).toLocaleString("es-AR")}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan={2}>
                      <hr
                        style={{
                          borderTop: "1px solid #000",
                          borderBottom: "none",
                          margin: "6px 0",
                        }}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        padding: "4px 0",
                        fontWeight: "bold",
                        fontSize: "18px",
                      }}
                    >
                      TOTAL NETO:
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        padding: "4px 0",
                        fontWeight: "bold",
                        fontSize: "18px",
                      }}
                    >
                      ${Math.round(totalNeto).toLocaleString("es-AR")}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Guía de Corte */}
          <div style={{ marginTop: "30px", textAlign: "center", color: "#999" }}>
            <hr style={{ borderTop: "1px dashed #ccc", borderBottom: 'none', margin: "-8px 0 0 0" }} />
          </div>
        </div>
      </div>
    );
  },
);
