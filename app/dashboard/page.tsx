import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/auth/LogoutButton";
import PedidosView from "@/components/pedidos/PedidosView";
import ImportarClientesModal from "@/components/clientes/ImportarClientesModal";
import MensajesWhatsappModal from "@/components/whatsapp/MensajesWhatsappModal";
import BackupButton from "@/components/backup/BackupButton";
import type { Pedido, Camion, Cliente, Producto, MensajeWhatsapp } from "@/types/database";

type NombreCliente = Pick<Cliente, "nombre" | "nombre_comercial">;
type DescripcionProducto = Pick<Producto, "descripcion">;

// PostgREST limita cada respuesta a 1000 filas por defecto (db-max-rows).
// Con ~2240 clientes importados, una sola consulta sin paginar se queda
// corta y, al no haber ORDER BY, qué 1000 filas caen dentro del corte es
// prácticamente arbitrario — así que cualquier cliente podía faltar en
// las sugerencias. Aquí se pagina hasta traerlos todos.
async function fetchTodosLosClientes(
  supabase: ReturnType<typeof createClient>
): Promise<NombreCliente[]> {
  const PAGE_SIZE = 1000;
  const resultado: NombreCliente[] = [];
  let desde = 0;

  while (true) {
    const { data, error } = await supabase
      .from("clientes")
      .select("nombre, nombre_comercial")
      .range(desde, desde + PAGE_SIZE - 1);

    if (error || !data) break;
    resultado.push(...data);
    if (data.length < PAGE_SIZE) break;
    desde += PAGE_SIZE;
  }

  return resultado;
}

// Mismo motivo que fetchTodosLosClientes: con ~2018 productos, una sola
// consulta sin paginar se quedaría corta por el límite de 1000 filas de
// PostgREST.
async function fetchTodosLosProductos(
  supabase: ReturnType<typeof createClient>
): Promise<DescripcionProducto[]> {
  const PAGE_SIZE = 1000;
  const resultado: DescripcionProducto[] = [];
  let desde = 0;

  while (true) {
    const { data, error } = await supabase
      .from("productos")
      .select("descripcion")
      .eq("activo", true)
      .range(desde, desde + PAGE_SIZE - 1);

    if (error || !data) break;
    resultado.push(...data);
    if (data.length < PAGE_SIZE) break;
    desde += PAGE_SIZE;
  }

  return resultado;
}

export default async function DashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [
    { data: pedidos },
    { data: pedidosEliminados },
    { data: camiones },
    clientes,
    productos,
    { data: mensajesWhatsapp },
  ] = await Promise.all([
    supabase
      .from("pedidos")
      .select("*, camiones(*)")
      .is("deleted_at", null)
      .order("fecha_entrega", { ascending: true })
      .order("orden", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true }),
    supabase
      .from("pedidos")
      .select("*, camiones(*)")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false }),
    supabase
      .from("camiones")
      .select("*")
      .order("nombre", { ascending: true }),
    fetchTodosLosClientes(supabase),
    fetchTodosLosProductos(supabase),
    supabase
      .from("mensajes_whatsapp")
      .select("*")
      .order("recibido_en", { ascending: false }),
  ]);

  // Clientes únicos para el autocompletado: nombres ya usados en pedidos
  // anteriores + nombre/nombre comercial de la tabla clientes (importada
  // desde Softek).
  const nombresDeClientesTabla = clientes.flatMap((c) => [c.nombre, c.nombre_comercial].filter(Boolean));
  const clientesSugeridos = Array.from(
    new Set([
      ...(pedidos ?? []).map((p: Pedido) => p.cliente).filter(Boolean),
      ...nombresDeClientesTabla,
    ])
  ) as string[];

  // Materiales únicos para el autocompletado: nombres ya usados en líneas
  // de pedidos anteriores + descripción de productos activos.
  const materialesDePedidos = (pedidos ?? []).flatMap((p: Pedido) =>
    (p.materiales ?? []).map((m) => m.material)
  );
  const materialesSugeridos = Array.from(
    new Set([
      ...materialesDePedidos.filter(Boolean),
      ...productos.map((p) => p.descripcion).filter(Boolean),
    ])
  ) as string[];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white px-4 py-3 md:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="relative h-9 w-32 shrink-0 md:h-11 md:w-44">
            <Image
              src="/logo-xaixo.png"
              alt="XAIXO Pedidos"
              fill
              className="object-contain object-left"
              priority
            />
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <span className="hidden text-sm text-gray-400 md:inline">{user.email}</span>
            <MensajesWhatsappModal mensajes={(mensajesWhatsapp ?? []) as MensajeWhatsapp[]} />
            <ImportarClientesModal />
            <Link
              href="/estadisticas"
              className="min-h-11 md:min-h-0 inline-flex items-center justify-center rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
            >
              📊 Estadísticas
            </Link>
            <BackupButton />
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <PedidosView
          pedidos={(pedidos ?? []) as Pedido[]}
          pedidosEliminados={(pedidosEliminados ?? []) as Pedido[]}
          camiones={(camiones ?? []) as Camion[]}
          clientesSugeridos={clientesSugeridos}
          materialesSugeridos={materialesSugeridos}
        />
      </main>
    </div>
  );
}
