import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EstadisticasView from "@/components/estadisticas/EstadisticasView";
import type { Pedido } from "@/types/database";

// Mismo motivo que fetchTodosLosClientes/fetchTodosLosProductos en
// app/dashboard/page.tsx: PostgREST limita cada respuesta a 1000 filas
// (db-max-rows), y aquí queremos "todo el historial" de pedidos, no un
// recorte arbitrario de los primeros 1000.
async function fetchTodosLosPedidos(
  supabase: ReturnType<typeof createClient>
): Promise<Pedido[]> {
  const PAGE_SIZE = 1000;
  const resultado: Pedido[] = [];
  let desde = 0;

  while (true) {
    const { data, error } = await supabase
      .from("pedidos")
      .select("*, camiones(*)")
      .is("deleted_at", null)
      .order("fecha_entrega", { ascending: true })
      .range(desde, desde + PAGE_SIZE - 1);

    if (error || !data) break;
    resultado.push(...(data as Pedido[]));
    if (data.length < PAGE_SIZE) break;
    desde += PAGE_SIZE;
  }

  return resultado;
}

export default async function EstadisticasPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const pedidos = await fetchTodosLosPedidos(supabase);

  return <EstadisticasView pedidos={pedidos} />;
}
