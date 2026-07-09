"use client";

import { useState } from "react";
import { deletePedido } from "@/app/dashboard/actions";

interface Props {
  pedidoId: string;
  onSuccess?: () => void;
  variant?: "compact" | "card" | "modal";
}

export default function BotonEliminar({ pedidoId, onSuccess, variant = "card" }: Props) {
  const [fase, setFase] = useState<"idle" | "confirmar" | "cargando">("idle");

  function pedir(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    setFase("confirmar");
  }

  async function confirmar(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    setFase("cargando");
    const res = await deletePedido(pedidoId);
    if (res.error) {
      setFase("idle");
      return;
    }
    onSuccess?.();
  }

  function cancelar(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    setFase("idle");
  }

  // ── Variante compacta: tarjetas calendario y tablero ──────────────────────
  if (variant === "compact") {
    if (fase === "confirmar") {
      return (
        <div className="mt-1 flex gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={confirmar}
            className="flex-1 rounded bg-red-600 py-0.5 text-[10px] font-semibold text-white hover:bg-red-700 transition-colors"
          >
            ¿Eliminar? Sí
          </button>
          <button
            onClick={cancelar}
            className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500 hover:bg-gray-200 transition-colors"
          >
            ✕
          </button>
        </div>
      );
    }
    return (
      <button
        onClick={pedir}
        disabled={fase === "cargando"}
        className="mt-1 w-full rounded border border-red-100 bg-red-50 py-0.5 text-[10px] font-medium text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50"
      >
        {fase === "cargando" ? "…" : "🗑 Eliminar"}
      </button>
    );
  }

  // ── Variante modal ─────────────────────────────────────────────────────────
  if (variant === "modal") {
    if (fase === "confirmar") {
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="mb-1 text-sm font-semibold text-red-800">
            ¿Seguro que quieres eliminar este pedido?
          </p>
          <p className="mb-3 text-xs text-red-600">Esta acción no se puede deshacer.</p>
          <div className="flex gap-2">
            <button
              onClick={confirmar}
              className="flex-1 inline-flex items-center justify-center min-h-11 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors md:min-h-0"
            >
              Sí, eliminar
            </button>
            <button
              onClick={cancelar}
              className="inline-flex items-center justify-center min-h-11 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors md:min-h-0"
            >
              Cancelar
            </button>
          </div>
        </div>
      );
    }
    return (
      <button
        onClick={pedir}
        disabled={fase === "cargando"}
        className="w-full inline-flex items-center justify-center min-h-11 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50 md:min-h-0"
      >
        {fase === "cargando" ? "Eliminando…" : "🗑 Eliminar pedido"}
      </button>
    );
  }

  // ── Variante card: vista lista ────────────────────────────────────────────
  if (fase === "confirmar") {
    return (
      <div className="mt-2 flex gap-1.5" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={confirmar}
          className="flex-1 inline-flex items-center justify-center min-h-11 rounded-lg bg-red-600 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition-colors md:min-h-0"
        >
          ¿Seguro? Eliminar
        </button>
        <button
          onClick={cancelar}
          className="inline-flex items-center justify-center min-h-11 min-w-11 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-500 hover:bg-gray-50 transition-colors md:min-h-0 md:min-w-0"
        >
          ✕
        </button>
      </div>
    );
  }
  return (
    <button
      onClick={pedir}
      disabled={fase === "cargando"}
      className="mt-2 w-full inline-flex items-center justify-center min-h-11 rounded-lg border border-red-100 bg-red-50 py-1.5 text-xs font-medium text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50 md:min-h-0"
    >
      {fase === "cargando" ? "Eliminando…" : "🗑 Eliminar"}
    </button>
  );
}
