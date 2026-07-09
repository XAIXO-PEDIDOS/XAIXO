import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/auth/LogoutButton";
import PedidosView from "@/components/pedidos/PedidosView";
import type { Pedido, Camion } from "@/types/database";

export default async function DashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: pedidos }, { data: camiones }] = await Promise.all([
    supabase
      .from("pedidos")
      .select("*, camiones(*)")
      .order("fecha_entrega", { ascending: true }),
    supabase
      .from("camiones")
      .select("*")
      .order("nombre", { ascending: true }),
  ]);

  // Clientes únicos para el autocompletado
  const clientesSugeridos = Array.from(
    new Set((pedidos ?? []).map((p: Pedido) => p.cliente).filter(Boolean))
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
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <PedidosView
          pedidos={(pedidos ?? []) as Pedido[]}
          camiones={(camiones ?? []) as Camion[]}
          clientesSugeridos={clientesSugeridos}
        />
      </main>
    </div>
  );
}
