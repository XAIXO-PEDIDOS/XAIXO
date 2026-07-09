"use client";

import { useEffect, useState } from "react";
import type { Pedido } from "@/types/database";
import { restaurarPedido } from "@/app/dashboard/actions";
import { formatTiempoRelativo } from "@/lib/tiempo";

interface Props {
  pedidos: Pedido[];
}

function resumenMateriales(pedido: Pedido): string {
  const mats = pedido.materiales ?? [];
  return mats
    .map((m) =>
      [m.cantidad != null ? m.cantidad : "", m.unidad || "", m.material]
        .filter(Boolean)
        .join(" ")
    )
    .join(" · ");
}

function BotonRestaurar({
  pedidoId,
  onSuccess,
}: {
  pedidoId: string;
  onSuccess: () => void;
}) {
  const [cargando, setCargando] = useState(false);

  async function handleClick() {
    setCargando(true);
    const res = await restaurarPedido(pedidoId);
    if (res.error) {
      setCargando(false);
      return;
    }
    onSuccess();
  }

  return (
    <button
      onClick={handleClick}
      disabled={cargando}
      className="mt-3 w-full min-h-11 md:min-h-0 inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-50"
    >
      {cargando ? "Restaurando…" : "↺ Restaurar pedido"}
    </button>
  );
}

export default function Papelera({ pedidos: initialPedidos }: Props) {
  const [pedidos, setPedidos] = useState<Pedido[]>(initialPedidos);

  useEffect(() => {
    setPedidos(initialPedidos);
  }, [initialPedidos]);

  function handleRestaurado(id: string) {
    setPedidos((prev) => prev.filter((p) => p.id !== id));
  }

  if (pedidos.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-gray-200 p-16 text-center">
        <p className="text-gray-400">No hay pedidos eliminados.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {pedidos.map((p) => {
        const fecha = new Date(p.fecha_entrega + "T00:00:00").toLocaleDateString("es-ES", {
          weekday: "short",
          day: "numeric",
          month: "short",
        });

        return (
          <div
            key={p.id}
            className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-4 shadow-sm"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base">🗑</span>
              <span className="font-semibold text-gray-900 truncate">{p.cliente}</span>
            </div>

            {resumenMateriales(p) && (
              <p className="mt-2 text-xs text-gray-600">{resumenMateriales(p)}</p>
            )}

            <p className="mt-2 text-xs font-medium text-gray-700">
              Entrega prevista: {fecha}
              {p.franja_horaria && (
                <span className="ml-1 font-normal text-gray-400">({p.franja_horaria})</span>
              )}
            </p>

            <p className="mt-1 text-xs text-red-500">
              Borrado {p.deleted_at ? formatTiempoRelativo(p.deleted_at) : ""}
            </p>

            <BotonRestaurar pedidoId={p.id} onSuccess={() => handleRestaurado(p.id)} />
          </div>
        );
      })}
    </div>
  );
}
