import type { MesaCaja } from '../store/useAppStore';

export async function obtenerDatosCajaExterna(url: string | undefined | null): Promise<MesaCaja[]> {
  if (!url) return [];
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Error en la respuesta de red");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error en cajaExternaService:", error);
    return []; // Devolvemos array vacío en caso de fallo para no romper la app
  }
}
