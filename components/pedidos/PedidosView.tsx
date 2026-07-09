"use client";

import { useState, useEffect } from "react";
import type { Camion, Pedido } from "@/types/database";
import PedidoCard from "./PedidoCard";
import PedidoForm from "./PedidoForm";
import CalendarioSemanal from "@/components/calendario/CalendarioSemanal";
import TableroCamiones from "@/components/tablero/TableroCamiones";

type Vista = "lista" | "calendario" | "tablero";

interface Props {
  pedidos: Pedido[];
  camiones: Camion[];
  clientesSugeridos: string[];
}

export default function PedidosView({ pedidos, camiones, clientesSugeridos }: Props) {
  const [vista, setVista] = useState<Vista>("calendario");
  const [modalOpen, setModalOpen] = useState(false);
  const [pedidoEditar, setPedidoEditar] = useState<Pedido | undefined>();

  function openCreate() {
    setPedidoEditar(undefined);
    setModalOpen(true);
  }
  function openEdit(p: Pedido) {
    setPedidoEditar(p);
    setModalOpen(true);
  }
  function closeModal() {
    setModalOpen(false);
    setPedidoEditar(undefined);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeModal();
    }
    if (modalOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  const pendientes = pedidos.filter((p) => p.estado === "pendiente");
  const confirmados = pedidos.filter((p) => p.estado === "confirmado");
  const cerrados = pedidos.filter(
    (p) => p.estado === "entregado" || p.estado === "cancelado"
  );

  return (
    <>
      {/* ── Barra superior ── */}
      <div className="flex flex-col gap-3 mb-6 md:flex-row md:items-center md:justify-between md:gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Pedidos</h2>
          <p className="text-sm text-gray-500">
            {pedidos.length} total · {pendientes.length} pendientes · {confirmados.length} confirmados
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:flex-nowrap">
          {/* Toggle de vista — píldora estilo segmented control */}
          <div className="flex items-center gap-0.5 rounded-xl bg-gray-100 p-1">
            {(
              [
                { key: "calendario", label: "Calendario" },
                { key: "tablero",    label: "Camiones" },
                { key: "lista",      label: "Lista" },
              ] as { key: Vista; label: string }[]
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setVista(key)}
                className={`min-h-11 md:min-h-0 inline-flex items-center justify-center px-2.5 py-1.5 rounded-lg text-xs md:px-3 md:text-sm font-medium transition-all ${
                  vista === key
                    ? "bg-white shadow-sm text-marca font-semibold"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={openCreate}
            className="min-h-11 md:min-h-0 inline-flex items-center justify-center rounded-lg bg-marca px-3 py-2 text-xs md:px-4 md:text-sm font-semibold text-white hover:bg-marca-hover transition-colors"
          >
            + Nuevo pedido
          </button>
        </div>
      </div>

      {/* ── Contenido según vista ── */}
      {vista === "calendario" ? (
        <CalendarioSemanal pedidos={pedidos} onEdit={openEdit} />
      ) : vista === "tablero" ? (
        <TableroCamiones pedidos={pedidos} camiones={camiones} onEdit={openEdit} />
      ) : (
        /* Vista lista */
        pedidos.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 p-16 text-center">
            <p className="text-gray-400">No hay pedidos todavía.</p>
            <button onClick={openCreate} className="mt-3 text-sm text-marca hover:underline">
              Crear el primero
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {confirmados.length > 0 && (
              <section>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Confirmados ({confirmados.length})
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {confirmados.map((p) => <PedidoCard key={p.id} pedido={p} onEdit={openEdit} />)}
                </div>
              </section>
            )}
            {pendientes.length > 0 && (
              <section>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Pendientes ({pendientes.length})
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {pendientes.map((p) => <PedidoCard key={p.id} pedido={p} onEdit={openEdit} />)}
                </div>
              </section>
            )}
            {cerrados.length > 0 && (
              <section>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Cerrados ({cerrados.length})
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {cerrados.map((p) => <PedidoCard key={p.id} pedido={p} onEdit={openEdit} />)}
                </div>
              </section>
            )}
          </div>
        )
      )}

      {/* ── Modal edición/creación ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative w-full max-w-lg max-h-full md:max-h-[90vh] overflow-y-auto rounded-none md:rounded-2xl bg-white shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
              <h2 className="text-base font-semibold text-gray-900">
                {pedidoEditar ? "Editar pedido" : "Nuevo pedido"}
              </h2>
              <button
                onClick={closeModal}
                className="inline-flex items-center justify-center min-h-11 min-w-11 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors md:min-h-0 md:min-w-0"
              >
                ✕
              </button>
            </div>
            <div className="px-6 py-5">
              <PedidoForm
                camiones={camiones}
                clientesSugeridos={clientesSugeridos}
                pedido={pedidoEditar}
                onClose={closeModal}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
