import { supabase } from "../lib/supabase";
import type { Bebida, ItemOperacion, Operacion } from "../types";

export async function registrarComanda(
  jornadaId: string,
  valoresFormulario: any,
  catalogoBebidas: Bebida[],
): Promise<Operacion> {
  // 1. Buscar si la mesa ya existe para esta jornada
  const { data: operacionExistente, error: searchError } = await supabase
    .from("operaciones")
    .select("*")
    .eq("jornada_id", jornadaId)
    .eq("numero_mesa", valoresFormulario.numero_mesa)
    .eq("estado", "Abierta") // <-- NUEVA REGLA
    .maybeSingle();

  if (searchError) {
    throw searchError;
  }

  let operacionId: string;
  let operacionFinal: Operacion;

  // 2. Determinar operacionId (usar el existente o crear uno nuevo)
  if (operacionExistente) {
    operacionId = operacionExistente.id;

    const huboCambios =
      operacionExistente.mozo_id !== valoresFormulario.mozo_id ||
      operacionExistente.cantidad_personas !==
        valoresFormulario.cantidad_personas;

    if (huboCambios) {
      const personasCambiaron =
        operacionExistente.cantidad_personas !==
        valoresFormulario.cantidad_personas;
      const { data: opActualizada, error: updateError } = await supabase
        .from("operaciones")
        .update({
          mozo_id: valoresFormulario.mozo_id,
          cantidad_personas: valoresFormulario.cantidad_personas,
        })
        .eq("id", operacionExistente.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // SALVAGUARDA: Si cambiaron las personas, reseteamos las bonificaciones de TODOS los ítems de esa mesa
      if (personasCambiaron) {
        const { error: resetError } = await supabase
          .from("items_operacion")
          .update({
            cantidad_bonificada_100: 0,
            cantidad_bonificada_50: 0,
          })
          .eq("operacion_id", operacionExistente.id);

        if (resetError) {
          console.error("Error al resetear bonificaciones:", resetError);
          // No lanzamos el error para no frenar la comanda, pero lo registramos
        }
      }
      operacionFinal = opActualizada as Operacion;
    } else {
      operacionFinal = operacionExistente as Operacion;
    }
  } else {
    const { data: nuevaOp, error: createError } = await supabase
      .from("operaciones")
      .insert({
        jornada_id: jornadaId,
        numero_mesa: valoresFormulario.numero_mesa,
        mozo_id: valoresFormulario.mozo_id,
        cantidad_personas: valoresFormulario.cantidad_personas,
      })
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    operacionId = nuevaOp.id;
    operacionFinal = nuevaOp as Operacion;
  }

  // 3. Mapear los ítems del formulario a la estructura de la tabla items_operacion
  const itemsMapeados: Partial<ItemOperacion>[] = valoresFormulario.items.map(
    (item: any) => {
      // Buscar la bebida en el catálogo pasado por parámetro
      const bebida = catalogoBebidas.find((b) => b.id === item.bebida_id);

      if (!bebida) {
        throw new Error(
          `Bebida no encontrada en el catálogo (ID: ${item.bebida_id})`,
        );
      }

      return {
        operacion_id: operacionId,
        bebida_id: item.bebida_id,
        cantidad: item.cantidad,
        precio_unitario: bebida.precio_actual,
        cantidad_bonificada_100: 0,
        cantidad_bonificada_50: 0,
      };
    },
  );

  // 4. Insertar los ítems
  const { error: itemsError } = await supabase
    .from("items_operacion")
    .insert(itemsMapeados);

  if (itemsError) {
    throw itemsError;
  }

  return operacionFinal;
}

export async function guardarCambiosCuenta(
  itemsAActualizar: {
    id: string;
    cantidad: number;
    cantidad_bonificada_100: number;
    cantidad_bonificada_50: number;
  }[],
  idsAEliminar: string[],
): Promise<void> {
  // 1. Eliminar los ítems borrados
  if (idsAEliminar.length > 0) {
    const { error: deleteError } = await supabase
      .from("items_operacion")
      .delete()
      .in("id", idsAEliminar);

    if (deleteError) throw deleteError;
  }

  // 2. Actualizar los ítems modificados o intactos
  if (itemsAActualizar.length > 0) {
    // Usamos Promise.all para ejecutar todos los updates en paralelo
    const updatePromises = itemsAActualizar.map((item) =>
      supabase
        .from("items_operacion")
        .update({
          cantidad: item.cantidad,
          cantidad_bonificada_100: item.cantidad_bonificada_100,
          cantidad_bonificada_50: item.cantidad_bonificada_50,
        })
        .eq("id", item.id),
    );

    const resultados = await Promise.all(updatePromises);
    // Verificamos si alguna de las promesas falló
    const errorUpdate = resultados.find((res) => res.error);
    if (errorUpdate) {
      throw errorUpdate.error;
    }
  }
}

export async function cobrarOperacion(
  operacionId: string,
  metodoPago: string,
  totalNeto: number,
): Promise<void> {
  const { error } = await supabase
    .from("operaciones")
    .update({
      estado: "Pagada",
      metodo_pago: metodoPago,
      total_neto: totalNeto,
    })
    .eq("id", operacionId);
  if (error) throw error;
}

export async function eliminarOperacion(operacionId: string): Promise<void> {
  // Por precaución, borramos primero los ítems (por si Supabase no tiene ON DELETE CASCADE activado)
  await supabase
    .from("items_operacion")
    .delete()
    .eq("operacion_id", operacionId);

  // Luego eliminamos la operación
  const { error } = await supabase
    .from("operaciones")
    .delete()
    .eq("id", operacionId);
  if (error) throw error;
}
