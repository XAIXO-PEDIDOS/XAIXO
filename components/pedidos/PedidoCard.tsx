"use client";

import type { Pedido } from "@/types/database";
import BotonEntregar from "./BotonEntregar";
import BotonRevertirEntregado from "./BotonRevertirEntregado";
import BotonEliminar from "./BotonEliminar";

interface Props {
  pedido: Pedido;
  onEdit: (p: Pedido) => void;
  onVer: (p: Pedido) => void;
}

function cardColors(pedido: Pedido) {
  if (pedido.tipo === "trailer_fabrica") {
    return { bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-700" };
  }
  const nombre = pedido.camiones?.nombre?.toLowerCase() ?? "";
  if (nombre.includes("franjo")) {
    return { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700" };
  }
  if (nombre.includes("david")) {
    return { bg: "bg-green-50", border: "border-green-300", text: "text-green-700" };
  }
  if (nombre.includes("transporte cliente")) {
    return { bg: "bg-purple-50", border: "border-purple-300", text: "text-purple-700" };
  }
  return { bg: "bg-gray-50", border: "border-gray-300", text: "text-gray-700" };
}

function estadoBadge(estado: string) {
  const base = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";
  switch (estado) {
    case "pendiente":   return <span className={`${base} bg-yellow-100 text-yellow-700`}>Pendiente</span>;
    case "confirmado":  return <span className={`${base} bg-blue-100 text-blue-700`}>Confirmado</span>;
    case "entregado":   return <span className={`${base} bg-green-100 text-green-700`}>Entregado</span>;
    case "cancelado":   return <span className={`${base} bg-red-100 text-red-700`}>Cancelado</span>;
    default: return null;
  }
}

export default function PedidoCard({ pedido, onEdit, onVer }: Props) {
  const bloqueado = pedido.estado === "entregado" || pedido.estado === "cancelado";
  const { bg, border, text } = cardColors(pedido);
  const isDashed = pedido.estado === "pendiente";

  const fecha = new Date(pedido.fecha_entrega + "T00:00:00").toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  const materiales = pedido.materiales ?? [];

  return (
    <div
      className={`rounded-xl border-2 p-4 shadow-sm transition-all ${bg} ${
        isDashed ? "border-dashed" : "border-solid"
      } ${border} ${bloqueado ? "opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">

          {/* Cliente + estado */}
          <div className="flex items-center gap-2 flex-wrap">
            {bloqueado && <span className="text-base">🔒</span>}
            <span className="font-semibold text-gray-900 truncate">{pedido.cliente}</span>
            {estadoBadge(pedido.estado)}
          </div>

          {/* Dirección */}
          {(pedido.direccion || pedido.obra) && (
            <p className="mt-1 text-xs text-gray-500 truncate">
              {pedido.direccion || pedido.obra}
            </p>
          )}

          {/* Materiales */}
          {materiales.length > 0 && (
            <ul className="mt-2 space-y-0.5">
              {materiales.map((m, i) => (
                <li key={i} className="text-xs text-gray-700 flex gap-1">
                  <span className="font-medium">{m.material}</span>
                  {(m.cantidad !== null || m.unidad) && (
                    <span className="text-gray-400">
                      — {m.cantidad != null ? m.cantidad : ""}{m.unidad ? ` ${m.unidad}` : ""}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}

          {/* Camión / tipo */}
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
            {pedido.camiones && (
              <span className={`font-medium ${text}`}>
                {pedido.camiones.nombre}
                {pedido.camiones.chofer_habitual && (
                  <span className="font-normal text-gray-400"> · {pedido.camiones.chofer_habitual}</span>
                )}
              </span>
            )}
            {pedido.tipo === "trailer_fabrica" && (
              <span className="text-orange-600 font-medium">Tráiler fábrica</span>
            )}
            {pedido.fabrica_origen && (
              <span className="text-gray-400">{pedido.fabrica_origen}</span>
            )}
          </div>

          {/* Fecha */}
          <div className="mt-1.5 text-xs font-medium text-gray-700">
            {fecha}
            {pedido.franja_horaria && (
              <span className="ml-1 font-normal text-gray-400">({pedido.franja_horaria})</span>
            )}
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2 md:gap-1">
          <a
            href={`/imprimir/${pedido.id}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Imprimir hoja de verificación de carga"
            className="inline-flex items-center justify-center min-h-11 min-w-11 rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-gray-600 transition-colors border border-transparent hover:border-gray-200 md:min-h-0 md:min-w-0"
          >
            🖨
          </a>
          <button
            onClick={() => onVer(pedido)}
            className="inline-flex items-center justify-center min-h-11 min-w-11 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-white hover:text-gray-900 transition-colors border border-transparent hover:border-gray-200 md:min-h-0 md:min-w-0"
          >
            👁 Ver
          </button>
          <button
            onClick={() => onEdit(pedido)}
            className="inline-flex items-center justify-center min-h-11 min-w-11 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-white hover:text-gray-900 transition-colors border border-transparent hover:border-gray-200 md:min-h-0 md:min-w-0"
          >
            {bloqueado ? "Ver" : "Editar"}
          </button>
        </div>
      </div>

      {!bloqueado && (
        <BotonEntregar pedidoId={pedido.id} variant="card" />
      )}
      {pedido.estado === "entregado" && (
        <BotonRevertirEntregado pedidoId={pedido.id} variant="card" />
      )}
      {!bloqueado && (
        <BotonEliminar pedidoId={pedido.id} variant="card" />
      )}
    </div>
  );
}
