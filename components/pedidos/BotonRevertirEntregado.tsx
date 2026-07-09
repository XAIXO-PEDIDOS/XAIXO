"use client";

import { useState } from "react";
import { revertirEntregado } from "@/app/dashboard/actions";

interface Props {
  pedidoId: string;
  onSuccess?: () => void;
  variant?: "compact" | "card" | "modal";
}

export default function BotonRevertirEntregado({ pedidoId, onSuccess, variant = "card" }: Props) {
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
    const res = await revertirEntregado(pedidoId);
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
            className="flex-1 rounded bg-gray-600 py-0.5 text-[10px] font-semibold text-white hover:bg-gray-700 transition-colors"
          >
            ¿Revertir? Sí
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
        className="mt-1 w-full rounded border border-gray-200 bg-gray-50 py-0.5 text-[10px] font-medium text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50"
      >
        {fase === "cargando" ? "…" : "↩ Marcar como no enviado"}
      </button>
    );
  }

  // ── Variante modal ─────────────────────────────────────────────────────────
  if (variant === "modal") {
    if (fase === "confirmar") {
      return (
        <div className="rounded-lg border border-gray-300 bg-gray-50 p-3">
          <p className="mb-2.5 text-sm font-medium text-gray-800">
            ¿Revertir el estado a «Confirmado»? El pedido volverá a ser editable.
          </p>
          <div className="flex gap-2">
            <button
              onClick={confirmar}
              className="flex-1 inline-flex items-center justify-center min-h-11 rounded-lg bg-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition-colors md:min-h-0"
            >
              Sí, revertir
            </button>
            <button
              onClick={cancelar}
              className="inline-flex items-center justify-center min-h-11 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors md:min-h-0"
            >
              No
            </button>
          </div>
        </div>
      );
    }
    return (
      <button
        onClick={pedir}
        disabled={fase === "cargando"}
        className="w-full inline-flex items-center justify-center min-h-11 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50 md:min-h-0"
      >
        {fase === "cargando" ? "Guardando…" : "↩ Marcar como no enviado"}
      </button>
    );
  }

  // ── Variante card: vista lista ────────────────────────────────────────────
  if (fase === "confirmar") {
    return (
      <div className="mt-2 flex gap-1.5" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={confirmar}
          className="flex-1 inline-flex items-center justify-center min-h-11 rounded-lg bg-gray-600 py-1.5 text-xs font-semibold text-white hover:bg-gray-700 transition-colors md:min-h-0"
        >
          ¿Revertir envío? ↩
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
      className="mt-2 w-full inline-flex items-center justify-center min-h-11 rounded-lg border border-gray-200 bg-gray-50 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50 md:min-h-0"
    >
      {fase === "cargando" ? "Guardando…" : "↩ Marcar como no enviado"}
    </button>
  );
}
