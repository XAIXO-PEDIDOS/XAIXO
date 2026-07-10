"use client";

import { useEffect, useState } from "react";
import type { MensajeWhatsapp } from "@/types/database";
import { marcarMensajeLeido } from "@/app/dashboard/mensajesWhatsappActions";
import { formatTiempoRelativo } from "@/lib/tiempo";

interface Props {
  mensajes: MensajeWhatsapp[];
}

function BotonMarcarLeido({ id, onSuccess }: { id: string; onSuccess: () => void }) {
  const [cargando, setCargando] = useState(false);

  async function handleClick() {
    setCargando(true);
    const res = await marcarMensajeLeido(id);
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
      className="min-h-11 md:min-h-0 inline-flex items-center justify-center rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50"
    >
      {cargando ? "Marcando…" : "✓ Marcar como leído"}
    </button>
  );
}

function TarjetaMensaje({
  mensaje,
  onLeido,
}: {
  mensaje: MensajeWhatsapp;
  onLeido?: () => void;
}) {
  return (
    <div
      className={`rounded-xl border-2 p-4 shadow-sm ${
        mensaje.leido
          ? "border-gray-200 bg-gray-50 opacity-70"
          : "border-purple-300 bg-purple-50"
      }`}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-sm font-semibold text-gray-900">
          {mensaje.telefono || "Número desconocido"}
        </span>
        <span className="text-xs text-gray-400">
          {formatTiempoRelativo(mensaje.recibido_en)}
        </span>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm text-gray-800">{mensaje.texto}</p>
      {onLeido && (
        <div className="mt-3">
          <BotonMarcarLeido id={mensaje.id} onSuccess={onLeido} />
        </div>
      )}
    </div>
  );
}

export default function MensajesWhatsappModal({ mensajes: initialMensajes }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<MensajeWhatsapp[]>(initialMensajes);

  useEffect(() => {
    setMensajes(initialMensajes);
  }, [initialMensajes]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setAbierto(false);
    }
    if (abierto) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [abierto]);

  function marcarComoLeidoLocal(id: string) {
    setMensajes((prev) => prev.map((m) => (m.id === id ? { ...m, leido: true } : m)));
  }

  const pendientes = mensajes.filter((m) => !m.leido);
  const atendidos = mensajes.filter((m) => m.leido);

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        className="relative min-h-11 md:min-h-0 inline-flex items-center justify-center rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
      >
        📩 WhatsApp
        {pendientes.length > 0 && (
          <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white min-w-[1.25rem]">
            {pendientes.length}
          </span>
        )}
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setAbierto(false)} />
          <div className="relative flex w-full max-w-2xl max-h-full md:max-h-[90vh] flex-col overflow-hidden rounded-none md:rounded-2xl bg-white shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
              <h2 className="text-base font-semibold text-gray-900">
                Pedidos pendientes WhatsApp
              </h2>
              <button
                onClick={() => setAbierto(false)}
                className="inline-flex items-center justify-center min-h-11 min-w-11 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors md:min-h-0 md:min-w-0"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              <section>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Sin revisar ({pendientes.length})
                </h3>
                {pendientes.length === 0 ? (
                  <p className="text-sm text-gray-400">No hay mensajes pendientes de revisar.</p>
                ) : (
                  <div className="space-y-3">
                    {pendientes.map((m) => (
                      <TarjetaMensaje
                        key={m.id}
                        mensaje={m}
                        onLeido={() => marcarComoLeidoLocal(m.id)}
                      />
                    ))}
                  </div>
                )}
              </section>

              {atendidos.length > 0 && (
                <section>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Ya atendidos ({atendidos.length})
                  </h3>
                  <div className="space-y-3">
                    {atendidos.map((m) => (
                      <TarjetaMensaje key={m.id} mensaje={m} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
