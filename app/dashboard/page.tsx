import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/auth/LogoutButton";
import PedidosView from "@/components/pedidos/PedidosView";
import ImportarClientesModal from "@/components/clientes/ImportarClientesModal";
import type { Pedido, Camion, Cliente } from "@/types/database";

type NombreCliente = Pick<Cliente, "nombre" | "nombre_comercial">;

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

export default async function DashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: pedidos }, { data: pedidosEliminados }, { data: camiones }, clientes] =
    await Promise.all([
      supabase
        .from("pedidos")
        .select("*, camiones(*)")
        .is("deleted_at", null)
        .order("fecha_entrega", { ascending: true }),
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
            <ImportarClientesModal />
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
        />
      </main>
    </div>
  );
}
