"use client";

import type { Pedido } from "@/types/database";

interface Props {
  pedido: Pedido;
  onClose: () => void;
  onEditar: () => void;
}

const ESTADO_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

function estadoBadgeClasses(estado: string): string {
  switch (estado) {
    case "pendiente":
      return "bg-yellow-100 text-yellow-700";
    case "confirmado":
      return "bg-blue-100 text-blue-700";
    case "entregado":
      return "bg-green-100 text-green-700";
    case "cancelado":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function Campo({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{etiqueta}</p>
      <div className="mt-0.5 text-sm text-gray-900">{children}</div>
    </div>
  );
}

export default function PedidoVistaPrevia({ pedido, onClose, onEditar }: Props) {
  const fecha = new Date(pedido.fecha_entrega + "T00:00:00").toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const materiales = pedido.materiales ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative flex w-full max-w-lg max-h-full md:max-h-[90vh] flex-col overflow-hidden rounded-none md:rounded-2xl bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">Detalle del pedido</h2>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center min-h-11 min-w-11 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors md:min-h-0 md:min-w-0"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${estadoBadgeClasses(
                pedido.estado
              )}`}
            >
              {ESTADO_LABELS[pedido.estado] ?? pedido.estado}
            </span>
            <span className="text-xs text-gray-400">
              {pedido.tipo === "trailer_fabrica" ? "Tráiler fábrica" : "Porte propio"}
            </span>
          </div>

          <Campo etiqueta="Cliente">{pedido.cliente}</Campo>

          {pedido.direccion && <Campo etiqueta="Dirección de entrega">{pedido.direccion}</Campo>}
          {pedido.obra && <Campo etiqueta="Obra">{pedido.obra}</Campo>}

          <div className="grid grid-cols-2 gap-4">
            <Campo etiqueta="Fecha de entrega">{fecha}</Campo>
            <Campo etiqueta="Franja horaria">{pedido.franja_horaria || "Sin especificar"}</Campo>
          </div>

          {pedido.tipo === "porte_propio" ? (
            <Campo etiqueta="Camión asignado">
              {pedido.camiones ? (
                <>
                  {pedido.camiones.nombre}
                  {pedido.camiones.chofer_habitual && (
                    <span className="text-gray-500"> · {pedido.camiones.chofer_habitual}</span>
                  )}
                </>
              ) : (
                <span className="text-gray-400">Sin asignar</span>
              )}
            </Campo>
          ) : (
            <Campo etiqueta="Fábrica origen">
              {pedido.fabrica_origen || <span className="text-gray-400">Sin especificar</span>}
            </Campo>
          )}

          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Productos / Materiales
            </p>
            {materiales.length > 0 ? (
              <ul className="space-y-1">
                {materiales.map((m, i) => (
                  <li key={i} className="flex gap-1.5 text-sm text-gray-900">
                    <span className="font-medium">{m.material}</span>
                    {(m.cantidad != null || m.unidad) && (
                      <span className="text-gray-400">
                        — {m.cantidad != null ? m.cantidad : ""}
                        {m.unidad ? ` ${m.unidad}` : ""}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400">Sin materiales especificados.</p>
            )}
          </div>

          {pedido.notas && (
            <Campo etiqueta="Notas">
              <p className="whitespace-pre-wrap">{pedido.notas}</p>
            </Campo>
          )}
        </div>

        <div className="flex gap-2 border-t border-gray-100 bg-white px-6 py-4">
          <button
            onClick={onClose}
            className="flex-1 min-h-11 md:min-h-0 inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
          <button
            onClick={onEditar}
            className="flex-1 min-h-11 md:min-h-0 inline-flex items-center justify-center rounded-lg bg-marca px-4 py-2.5 text-sm font-semibold text-white hover:bg-marca-hover transition-colors"
          >
            Editar
          </button>
        </div>
      </div>
    </div>
  );
}
