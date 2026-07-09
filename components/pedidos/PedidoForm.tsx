"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createPedido, updatePedido } from "@/app/dashboard/actions";
import BotonEntregar from "./BotonEntregar";
import BotonRevertirEntregado from "./BotonRevertirEntregado";
import BotonEliminar from "./BotonEliminar";
import type { Camion, MaterialItem, Pedido, TipoPedido, EstadoPedido } from "@/types/database";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full min-h-11 md:min-h-0 inline-flex items-center justify-center rounded-lg bg-marca px-4 py-3 text-sm font-semibold text-white hover:bg-marca-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {pending ? "Guardando…" : label}
    </button>
  );
}

const ESTADOS: { value: EstadoPedido; label: string }[] = [
  { value: "pendiente", label: "Pendiente" },
  { value: "confirmado", label: "Confirmado" },
  { value: "entregado", label: "Entregado" },
  { value: "cancelado", label: "Cancelado" },
];

const MATERIAL_VACIO: MaterialItem = { material: "", cantidad: null, unidad: "" };

interface Props {
  camiones: Camion[];
  clientesSugeridos: string[];
  pedido?: Pedido;
  onClose: () => void;
}

export default function PedidoForm({ camiones, clientesSugeridos, pedido, onClose }: Props) {
  const isEdit = !!pedido;
  const [state, formAction] = useFormState(isEdit ? updatePedido : createPedido, { error: null });

  const [tipo, setTipo] = useState<TipoPedido>(pedido?.tipo ?? "porte_propio");
  const [camionId, setCamionId] = useState(pedido?.camion_id ?? "");
  const [clienteInput, setClienteInput] = useState(pedido?.cliente ?? "");
  const [showSugerencias, setShowSugerencias] = useState(false);
  const [materiales, setMateriales] = useState<MaterialItem[]>(
    pedido?.materiales?.length ? pedido.materiales : [{ ...MATERIAL_VACIO }]
  );

  const bloqueado = pedido?.estado === "entregado" || pedido?.estado === "cancelado";
  const camionSeleccionado = camiones.find((c) => c.id === camionId);

  useEffect(() => {
    if (state.success) onClose();
  }, [state.success]);

  // Materiales helpers
  function addMaterial() {
    if (materiales.length < 10) setMateriales([...materiales, { ...MATERIAL_VACIO }]);
  }

  function removeMaterial(i: number) {
    if (materiales.length > 1) setMateriales(materiales.filter((_, idx) => idx !== i));
  }

  function updateMaterial(i: number, field: keyof MaterialItem, value: string | number | null) {
    setMateriales(materiales.map((m, idx) => (idx === i ? { ...m, [field]: value } : m)));
  }

  const sugerenciasFiltradas = clientesSugeridos.filter(
    (c) => c.toLowerCase().includes(clienteInput.toLowerCase()) && c !== clienteInput
  );

  return (
    <form action={formAction} className="space-y-5">
      {isEdit && <input type="hidden" name="id" value={pedido.id} />}
      {/* Materiales serializado como JSON */}
      <input type="hidden" name="materiales" value={JSON.stringify(materiales)} />

      {/* ── Tipo de pedido ── */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Tipo de pedido
        </label>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {(["porte_propio", "trailer_fabrica"] as TipoPedido[]).map((t) => (
            <button
              key={t}
              type="button"
              disabled={bloqueado}
              onClick={() => setTipo(t)}
              className={`min-h-11 md:min-h-0 rounded-lg border-2 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
                tipo === t
                  ? t === "porte_propio"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-orange-500 bg-orange-50 text-orange-700"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              {t === "porte_propio" ? "Porte propio" : "Tráiler fábrica"}
            </button>
          ))}
        </div>
        <input type="hidden" name="tipo" value={tipo} />
      </div>

      {/* ── Cliente ── */}
      <div className="relative">
        <label htmlFor="cliente" className="block text-sm font-medium text-gray-700 mb-1">
          Cliente <span className="text-red-500">*</span>
        </label>
        <input
          id="cliente"
          name="cliente"
          type="text"
          required
          disabled={bloqueado}
          value={clienteInput}
          onChange={(e) => { setClienteInput(e.target.value); setShowSugerencias(true); }}
          onBlur={() => setTimeout(() => setShowSugerencias(false), 150)}
          onFocus={() => setShowSugerencias(true)}
          autoComplete="off"
          className="w-full min-h-11 md:min-h-0 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
          placeholder="Nombre del cliente"
        />
        {showSugerencias && sugerenciasFiltradas.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-40 overflow-y-auto">
            {sugerenciasFiltradas.slice(0, 8).map((c) => (
              <li key={c}>
                <button
                  type="button"
                  onMouseDown={() => { setClienteInput(c); setShowSugerencias(false); }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                >
                  {c}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Dirección ── */}
      <div>
        <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 mb-1">
          {tipo === "trailer_fabrica" ? "Obra / Dirección" : "Dirección de entrega"}
        </label>
        <input
          id="direccion"
          name="direccion"
          type="text"
          disabled={bloqueado}
          defaultValue={pedido?.direccion ?? ""}
          className="w-full min-h-11 md:min-h-0 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
          placeholder="Dirección completa"
        />
      </div>

      {/* ── Materiales ── */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Productos / Materiales <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          {materiales.map((m, i) => (
            <div key={i} className="flex flex-col gap-2 md:flex-row md:items-center">
              {/* Nombre */}
              <input
                type="text"
                value={m.material}
                disabled={bloqueado}
                onChange={(e) => updateMaterial(i, "material", e.target.value)}
                placeholder="Material"
                className="w-full min-h-11 md:min-h-0 md:flex-1 md:min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
              />
              {/* Cantidad + unidad + quitar: fila propia en móvil, se integran en la fila principal en escritorio */}
              <div className="flex gap-2 items-center md:contents">
                {/* Cantidad */}
                <input
                  type="number"
                  value={m.cantidad ?? ""}
                  disabled={bloqueado}
                  onChange={(e) =>
                    updateMaterial(i, "cantidad", e.target.value ? Number(e.target.value) : null)
                  }
                  placeholder="Cant."
                  min="0"
                  step="0.5"
                  className="w-20 shrink-0 min-h-11 md:min-h-0 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
                />
                {/* Unidad libre */}
                <input
                  type="text"
                  value={m.unidad}
                  disabled={bloqueado}
                  onChange={(e) => updateMaterial(i, "unidad", e.target.value)}
                  placeholder="ud / t / m²…"
                  className="w-24 shrink-0 min-h-11 md:min-h-0 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
                />
                {/* Quitar fila */}
                {!bloqueado && (
                  <button
                    type="button"
                    onClick={() => removeMaterial(i)}
                    disabled={materiales.length === 1}
                    className="shrink-0 min-h-11 min-w-11 md:min-h-0 md:min-w-0 inline-flex items-center justify-center rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-30 transition-colors"
                    title="Quitar línea"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        {!bloqueado && materiales.length < 10 && (
          <button
            type="button"
            onClick={addMaterial}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            + Añadir producto
          </button>
        )}
      </div>

      {/* ── Fecha + Franja ── */}
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <div>
          <label htmlFor="fecha_entrega" className="block text-sm font-medium text-gray-700 mb-1">
            Fecha de entrega <span className="text-red-500">*</span>
          </label>
          <input
            id="fecha_entrega"
            name="fecha_entrega"
            type="date"
            required
            disabled={bloqueado}
            defaultValue={pedido?.fecha_entrega ?? ""}
            className="w-full min-h-11 md:min-h-0 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
          />
        </div>
        <div>
          <label htmlFor="franja_horaria" className="block text-sm font-medium text-gray-700 mb-1">
            Franja horaria
          </label>
          <select
            id="franja_horaria"
            name="franja_horaria"
            disabled={bloqueado}
            defaultValue={pedido?.franja_horaria ?? ""}
            className="w-full min-h-11 md:min-h-0 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
          >
            <option value="">Sin especificar</option>
            <option value="mañana">Mañana</option>
            <option value="tarde">Tarde</option>
            <option value="todo el día">Todo el día</option>
          </select>
        </div>
      </div>

      {/* ── Camión (solo porte_propio) ── */}
      {tipo === "porte_propio" && (
        <div>
          <label htmlFor="camion_id" className="block text-sm font-medium text-gray-700 mb-1">
            Camión
          </label>
          <select
            id="camion_id"
            name="camion_id"
            disabled={bloqueado}
            value={camionId}
            onChange={(e) => setCamionId(e.target.value)}
            className="w-full min-h-11 md:min-h-0 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
          >
            <option value="">Sin asignar</option>
            {camiones.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} ({c.capacidad_toneladas}t)
              </option>
            ))}
          </select>
          {camionSeleccionado?.chofer_habitual && (
            <p className="mt-1.5 text-xs text-gray-500">
              Chofer: <span className="font-medium text-gray-700">{camionSeleccionado.chofer_habitual}</span>
            </p>
          )}
        </div>
      )}

      {/* ── Fábrica origen (solo trailer_fabrica) ── */}
      {tipo === "trailer_fabrica" && (
        <div>
          <label htmlFor="fabrica_origen" className="block text-sm font-medium text-gray-700 mb-1">
            Fábrica origen
          </label>
          <input
            id="fabrica_origen"
            name="fabrica_origen"
            type="text"
            disabled={bloqueado}
            defaultValue={pedido?.fabrica_origen ?? ""}
            className="w-full min-h-11 md:min-h-0 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
            placeholder="ej. Cementos Portland Tudela"
          />
        </div>
      )}

      {/* ── Estado (solo edición) ── */}
      {isEdit && (
        <div>
          <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-1">
            Estado
          </label>
          <select
            id="estado"
            name="estado"
            disabled={bloqueado}
            defaultValue={pedido.estado}
            className="w-full min-h-11 md:min-h-0 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
          >
            {ESTADOS.map((e) => (
              <option key={e.value} value={e.value}>{e.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* ── Notas ── */}
      <div>
        <label htmlFor="notas" className="block text-sm font-medium text-gray-700 mb-1">
          Notas
        </label>
        <textarea
          id="notas"
          name="notas"
          rows={2}
          disabled={bloqueado}
          defaultValue={pedido?.notas ?? ""}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 resize-none"
          placeholder="Indicaciones adicionales…"
        />
      </div>

      {state.error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
      )}

      {bloqueado ? (
        <>
          <p className="text-center text-sm text-gray-500 py-2">
            🔒 Este pedido está {pedido.estado} y no se puede modificar.
          </p>
          {isEdit && pedido!.estado === "entregado" && (
            <BotonRevertirEntregado
              pedidoId={pedido!.id}
              onSuccess={onClose}
              variant="modal"
            />
          )}
        </>
      ) : (
        <>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-11 md:min-h-0 inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <div className="flex-1">
              <SubmitButton label={isEdit ? "Guardar cambios" : "Crear pedido"} />
            </div>
          </div>
          {isEdit && (
            <BotonEntregar
              pedidoId={pedido!.id}
              onSuccess={onClose}
              variant="modal"
            />
          )}
          {isEdit && (
            <BotonEliminar
              pedidoId={pedido!.id}
              onSuccess={onClose}
              variant="modal"
            />
          )}
        </>
      )}

      {pedido && (
        <a
          href={`/imprimir/${pedido.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex min-h-11 md:min-h-0 items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
        >
          🖨 Imprimir hoja de verificación de carga
        </a>
      )}
    </form>
  );
}
