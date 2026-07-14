import * as XLSX from "xlsx";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Cliente, MaterialItem, Pedido, Producto } from "@/types/database";

// PostgREST limita cada respuesta a 1000 filas (db-max-rows) — mismo motivo
// que fetchTodosLosClientes/fetchTodosLosProductos en app/dashboard/page.tsx.
// Un backup no se puede permitir perder filas por ese límite, así que aquí
// se pagina siempre, también para pedidos.
const PAGE_SIZE = 1000;

async function fetchAll<T>(
  supabase: SupabaseClient,
  table: string,
  select: string
): Promise<T[]> {
  const resultado: T[] = [];
  let desde = 0;

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .order("id", { ascending: true })
      .range(desde, desde + PAGE_SIZE - 1);

    if (error) throw new Error(`Error leyendo ${table} para el backup: ${error.message}`);
    if (!data || data.length === 0) break;

    resultado.push(...(data as T[]));
    if (data.length < PAGE_SIZE) break;
    desde += PAGE_SIZE;
  }

  return resultado;
}

function formatMateriales(materiales: MaterialItem[] | null): string {
  return (materiales ?? [])
    .map((m) => [m.cantidad, m.unidad, m.material].filter(Boolean).join(" "))
    .join("; ");
}

type PedidoConCamion = Pedido & { camiones: { nombre: string } | null };

function filaPedido(p: PedidoConCamion) {
  return {
    id: p.id,
    cliente: p.cliente,
    direccion: p.direccion ?? "",
    materiales: formatMateriales(p.materiales),
    tipo: p.tipo,
    camion: p.camiones?.nombre ?? "",
    fabrica_origen: p.fabrica_origen ?? "",
    obra: p.obra ?? "",
    fecha_entrega: p.fecha_entrega,
    franja_horaria: p.franja_horaria ?? "",
    estado: p.estado,
    notas: p.notas ?? "",
    creado_por: p.creado_por ?? "",
    created_at: p.created_at,
    updated_at: p.updated_at,
    eliminado: p.deleted_at ? "sí" : "no",
    deleted_at: p.deleted_at ?? "",
  };
}

/**
 * Construye el workbook de backup (Pedidos, Clientes, Productos) a partir de
 * cualquier cliente de Supabase que exponga from/select/order/range — sirve
 * tanto para el cliente con sesión del usuario (botón manual) como para el
 * cliente con Service Role Key (cron, sin sesión).
 */
export async function construirWorkbookBackup(supabase: SupabaseClient): Promise<XLSX.WorkBook> {
  const [pedidos, clientes, productos] = await Promise.all([
    fetchAll<PedidoConCamion>(supabase, "pedidos", "*, camiones(nombre)"),
    fetchAll<Cliente>(supabase, "clientes", "*"),
    fetchAll<Producto>(supabase, "productos", "*"),
  ]);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(pedidos.map(filaPedido)),
    "Pedidos"
  );
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(clientes), "Clientes");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(productos), "Productos");

  return workbook;
}

export function nombreArchivoBackup(fecha: Date = new Date()): string {
  return `backup-xaixo-pedidos-${fecha.toISOString().slice(0, 10)}.xlsx`;
}
