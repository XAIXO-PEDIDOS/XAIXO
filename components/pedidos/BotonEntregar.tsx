"use client";

import { useState } from "react";
import { marcarEntregado } from "@/app/dashboard/actions";

interface Props {
  pedidoId: string;
  onSuccess?: () => void;
  variant?: "compact" | "card" | "modal";
}

export default function BotonEntregar({ pedidoId, onSuccess, variant = "card" }: Props) {
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
    const res = await marcarEntregado(pedidoId);
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
        <div className="mt-1.5 flex gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={confirmar}
            className="flex-1 rounded bg-green-600 py-0.5 text-[10px] font-semibold text-white hover:bg-green-700 transition-colors"
          >
            ¿Enviado? Sí ✓
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
        className="mt-1.5 w-full rounded border border-green-200 bg-green-50 py-0.5 text-[10px] font-semibold text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50"
      >
        {fase === "cargando" ? "…" : "✓ Camión enviado"}
      </button>
    );
  }

  // ── Variante modal: formulario de edición ─────────────────────────────────
  if (variant === "modal") {
    if (fase === "confirmar") {
      return (
        <div className="rounded-lg border border-green-300 bg-green-50 p-3">
          <p className="mb-2.5 text-sm font-medium text-green-900">
            ¿Confirmar que el camión ha sido cargado y enviado?
          </p>
          <div className="flex gap-2">
            <button
              onClick={confirmar}
              className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
            >
              Sí, marcar como enviado
            </button>
            <button
              onClick={cancelar}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
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
        className="w-full rounded-lg border border-green-300 bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50"
      >
        {fase === "cargando" ? "Guardando…" : "✓ Camión enviado"}
      </button>
    );
  }

  // ── Variante card: vista lista ────────────────────────────────────────────
  if (fase === "confirmar") {
    return (
      <div className="mt-2 flex gap-1.5" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={confirmar}
          className="flex-1 rounded-lg bg-green-600 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition-colors"
        >
          ¿Confirmar envío? ✓
        </button>
        <button
          onClick={cancelar}
          className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
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
      className="mt-2 w-full rounded-lg border border-green-200 bg-green-50 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50"
    >
      {fase === "cargando" ? "Guardando…" : "✓ Camión enviado"}
    </button>
  );
}
