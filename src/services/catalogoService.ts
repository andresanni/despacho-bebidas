import { supabase } from "../lib/supabase";
import type { Bebida } from "../types";

export async function upsertBebida(bebida: Partial<Bebida>): Promise<Bebida> {
  const payload = {
    ...bebida,
    id: bebida.id || crypto.randomUUID(), // Genera ID si es nueva
  };

  const { data, error } = await supabase
    .from("bebidas")
    .upsert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function toggleBebidaActiva(
  id: string,
  activo: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("bebidas")
    .update({ activo })
    .eq("id", id);

  if (error) throw error;
}
