import { supabase } from "../lib/supabase";

export async function cerrarJornadaSegura(jornadaId: string): Promise<void> {
  // 1. El Patovica: Verificar si hay mesas abiertas
  const { count, error: countError } = await supabase
    .from("operaciones")
    .select("*", { count: "exact", head: true })
    .eq("jornada_id", jornadaId)
    .eq("estado", "Abierta");

  if (countError) throw countError;

  if (count && count > 0) {
    throw new Error(
      `No se puede cerrar la caja. Hay ${count} mesa(s) sin cobrar o anular.`,
    );
  }

  // 2. Si todo está limpio, cerramos la jornada
  const { error: updateError } = await supabase
    .from("jornadas")
    .update({ estado: "cerrada" }) // Nota: la BD espera 'cerrada' (minúsculas por enumeración o string normal)
    .eq("id", jornadaId);

  if (updateError) throw updateError;
}
