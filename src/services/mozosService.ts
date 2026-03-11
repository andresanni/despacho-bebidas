import { supabase } from "../lib/supabase";
import type { Mozo } from "../types";

export async function upsertMozo(mozo: Partial<Mozo>): Promise<Mozo> {
  const payload = {
    ...mozo,
    id: mozo.id || crypto.randomUUID(), // Genera ID si es nuevo
  };

  const { data, error } = await supabase
    .from("mozos")
    .upsert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function toggleMozoActivo(
  id: string,
  activo: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("mozos")
    .update({ activo })
    .eq("id", id);

  if (error) throw error;
}
