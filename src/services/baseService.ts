import { supabase } from "../lib/supabase";

export async function getAll<T>(tableName: string): Promise<T[]> {
  const { data, error } = await supabase.from(tableName).select("*");

  if (error) {
    throw error;
  }

  return data as T[];
}

export async function getById<T>(tableName: string, id: string): Promise<T> {
  const { data, error } = await supabase
    .from(tableName)
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }

  return data as T;
}

export async function create<T>(
  tableName: string,
  payload: Partial<T>,
): Promise<T> {
  const { data, error } = await supabase
    .from(tableName)
    .insert([payload])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as T;
}

export async function update<T>(
  tableName: string,
  id: string,
  payload: Partial<T>,
): Promise<T> {
  const { data, error } = await supabase
    .from(tableName)
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as T;
}

export async function remove(tableName: string, id: string): Promise<void> {
  const { error } = await supabase.from(tableName).delete().eq("id", id);

  if (error) {
    throw error;
  }
}
