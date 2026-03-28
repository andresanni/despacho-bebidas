import React from "react";

export interface TicketProps {
  operacion: any;
  mozoNombre: string;
  itemsCalculados: any[];
  totalBruto: number;
  totalDescuentos: number;
  totalNeto: number;
}

export const TicketImpresion = React.forwardRef<HTMLDivElement, TicketProps>(
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
    return (
      <div style={{ display: "none" }}>
        <div
          ref={ref}
          style={{
            padding: "20px",
            fontFamily: "monospace",
            width: "300px",
            color: "black",
            backgroundColor: "white",
            fontSize: "12px",
          }}
        >
          {/* Cabecera */}
          <div style={{ textAlign: "center", marginBottom: "10px" }}>
            <h2 style={{ margin: 0 }}>NUESTRO BAR</h2>
            <p style={{ margin: 0 }}>--------------------------------</p>
            <p style={{ margin: 0 }}>
              MESA: {operacion?.numero_mesa} | PERS:{" "}
              {operacion?.cantidad_personas || "-"}
            </p>
            <p style={{ margin: 0 }}>MOZO: {mozoNombre}</p>
            <p style={{ margin: 0 }}>--------------------------------</p>
          </div>
          {/* Detalle Bruto */}
          <div style={{ marginBottom: "10px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontWeight: "bold",
              }}
            >
              <span>CANT x DESC</span>
              <span>SUBT</span>
            </div>
            {itemsCalculados.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "4px",
                }}
              >
                <span>
                  {item.cantidadEditable} x {item.bebidaNombre}
                </span>
                <span>
                  ${Math.round(item.cantidadEditable * item.precio_unitario).toLocaleString("es-AR")}
                </span>
              </div>
            ))}
          </div>
          <div
            style={{
              textAlign: "right",
              fontWeight: "bold",
              marginBottom: "10px",
            }}
          >
            SUBTOTAL BRUTO: ${Math.round(totalBruto).toLocaleString("es-AR")}
          </div>
          {/* Sección de Bonificaciones (Solo si hay descuentos) */}
          {totalDescuentos > 0 && (
            <div style={{ marginBottom: "10px" }}>
              <p style={{ margin: 0, textAlign: "center" }}>
                --- BONIFICACIONES ---
              </p>
              {itemsCalculados
                .filter((i) => i.b100 > 0 || i.b50 > 0)
                .map((item, idx) => {
                  const desc100 = item.b100 * item.precio_unitario;
                  const desc50 = item.b50 * (item.precio_unitario * 0.5);
                  return (
                    <div key={`bonif-${idx}`}>
                      {item.b100 > 0 && (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            color: "#555",
                          }}
                        >
                          <span>
                            -{item.b100} {item.bebidaNombre} (100%)
                          </span>
                          <span>-${Math.round(desc100).toLocaleString("es-AR")}</span>
                        </div>
                      )}
                      {item.b50 > 0 && (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            color: "#555",
                          }}
                        >
                          <span>
                            -{item.b50} {item.bebidaNombre} (50%)
                          </span>
                          <span>-${Math.round(desc50).toLocaleString("es-AR")}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
          {/* Total y Ahorro */}
          <p style={{ margin: 0 }}>--------------------------------</p>
          <h3
            style={{ margin: "10px 0", textAlign: "right", fontSize: "16px" }}
          >
            TOTAL: ${Math.round(totalNeto).toLocaleString("es-AR")}
          </h3>

          {totalDescuentos > 0 && (
            <p style={{ textAlign: "right", fontStyle: "italic", margin: 0 }}>
              ¡Usted ahorró: ${Math.round(totalDescuentos).toLocaleString("es-AR")}!
            </p>
          )}
          <p style={{ textAlign: "center", marginTop: "20px" }}>
            ¡Gracias por su visita!
          </p>
        </div>
      </div>
    );
  },
);
TicketImpresion.displayName = "TicketImpresion";
