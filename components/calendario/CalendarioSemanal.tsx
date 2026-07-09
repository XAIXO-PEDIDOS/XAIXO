"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  pointerWithin,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { Pedido, EstadoPedido } from "@/types/database";
import { actualizarFechaEntrega } from "@/app/dashboard/actions";
import BotonEntregar from "@/components/pedidos/BotonEntregar";
import BotonRevertirEntregado from "@/components/pedidos/BotonRevertirEntregado";
import BotonEliminar from "@/components/pedidos/BotonEliminar";
import {
  lunesDeSemana,
  addDias,
  toDateStr,
  diasLaborables,
  formatDiaCorto,
  formatRangoSemana,
  esHoy,
} from "@/lib/semana";

// ─── Colores por camión / tipo ───────────────────────────────────────────────

function coloresPedido(pedido: Pedido) {
  if (pedido.tipo === "trailer_fabrica") {
    return {
      bg: "bg-orange-50",
      border: "border-orange-300",
      texto: "text-orange-700",
    };
  }
  const nombre = pedido.camiones?.nombre?.toLowerCase() ?? "";
  if (nombre.includes("franjo"))
    return { bg: "bg-blue-50", border: "border-blue-300", texto: "text-blue-700" };
  if (nombre.includes("david"))
    return { bg: "bg-green-50", border: "border-green-300", texto: "text-green-700" };
  return { bg: "bg-gray-50", border: "border-gray-300", texto: "text-gray-600" };
}

function resumenMateriales(pedido: Pedido): string {
  const mats = pedido.materiales ?? [];
  if (mats.length === 0) return "";
  const primero = mats[0];
  const label = [
    primero.cantidad != null ? primero.cantidad : "",
    primero.unidad || "",
    primero.material,
  ]
    .filter(Boolean)
    .join(" ");
  return mats.length > 1 ? `${label} +${mats.length - 1}` : label;
}

// ─── Contenido de la tarjeta (reutilizado en overlay) ────────────────────────

function ContenidoTarjeta({
  pedido,
  overlay = false,
  onEntregar,
  onRevertir,
  onEliminar,
}: {
  pedido: Pedido;
  overlay?: boolean;
  onEntregar?: (pedidoId: string) => void;
  onRevertir?: (pedidoId: string) => void;
  onEliminar?: (pedidoId: string) => void;
}) {
  const bloqueado =
    pedido.estado === "entregado" || pedido.estado === "cancelado";
  const { bg, border, texto } = coloresPedido(pedido);
  const borde = pedido.estado === "pendiente" ? "border-dashed" : "border-solid";

  return (
    <div
      className={`
        rounded-lg border-2 px-2.5 py-2 text-xs leading-snug select-none shadow-sm
        ${bg} ${border} ${borde}
        ${bloqueado ? "opacity-60" : ""}
        ${overlay ? "shadow-xl rotate-1 scale-105" : ""}
      `}
    >
      <div className="flex items-center gap-1 min-w-0">
        {bloqueado && <span className="shrink-0">🔒</span>}
        <span className="font-semibold text-gray-900 truncate">{pedido.cliente}</span>
      </div>

      {resumenMateriales(pedido) && (
        <p className="mt-0.5 text-gray-500 truncate">{resumenMateriales(pedido)}</p>
      )}

      <p className={`mt-0.5 font-medium truncate ${texto}`}>
        {pedido.tipo === "trailer_fabrica"
          ? "Tráiler fábrica"
          : (pedido.camiones?.nombre ?? "Sin asignar")}
      </p>

      {pedido.franja_horaria && (
        <p className="mt-0.5 text-gray-400">{pedido.franja_horaria}</p>
      )}
      {!bloqueado && !overlay && onEntregar && (
        <div className="mt-1.5" onClick={(e) => e.stopPropagation()}>
          <BotonEntregar
            pedidoId={pedido.id}
            onSuccess={() => onEntregar(pedido.id)}
            variant="compact"
          />
        </div>
      )}
      {pedido.estado === "entregado" && !overlay && onRevertir && (
        <div className="mt-1" onClick={(e) => e.stopPropagation()}>
          <BotonRevertirEntregado
            pedidoId={pedido.id}
            onSuccess={() => onRevertir(pedido.id)}
            variant="compact"
          />
        </div>
      )}
      {!bloqueado && !overlay && onEliminar && (
        <div className="mt-1" onClick={(e) => e.stopPropagation()}>
          <BotonEliminar
            pedidoId={pedido.id}
            onSuccess={() => onEliminar(pedido.id)}
            variant="compact"
          />
        </div>
      )}
    </div>
  );
}

// ─── Tarjeta arrastrable ─────────────────────────────────────────────────────

function TarjetaArrastrable({
  pedido,
  onEdit,
  onEntregar,
  onRevertir,
  onEliminar,
}: {
  pedido: Pedido;
  onEdit: (p: Pedido) => void;
  onEntregar: (pedidoId: string) => void;
  onRevertir: (pedidoId: string) => void;
  onEliminar: (pedidoId: string) => void;
}) {
  const bloqueado =
    pedido.estado === "entregado" || pedido.estado === "cancelado";

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: pedido.id, disabled: bloqueado });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0 : 1,
    touchAction: "none",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(!bloqueado ? listeners : {})}
      {...attributes}
      onClick={() => onEdit(pedido)}
      className={bloqueado ? "cursor-default" : "cursor-grab active:cursor-grabbing"}
      title={bloqueado ? "Pedido bloqueado" : "Arrastrar para cambiar de día · Clic para editar"}
    >
      <ContenidoTarjeta pedido={pedido} onEntregar={onEntregar} onRevertir={onRevertir} onEliminar={onEliminar} />
    </div>
  );
}

// ─── Columna droppable ────────────────────────────────────────────────────────

function ColumnaDroppable({
  fecha,
  pedidos,
  onEdit,
  onEntregar,
  onRevertir,
  onEliminar,
}: {
  fecha: Date;
  pedidos: Pedido[];
  onEdit: (p: Pedido) => void;
  onEntregar: (pedidoId: string) => void;
  onRevertir: (pedidoId: string) => void;
  onEliminar: (pedidoId: string) => void;
}) {
  const dateStr = toDateStr(fecha);
  const { setNodeRef, isOver } = useDroppable({ id: dateStr });

  const hoy = esHoy(fecha);
  const labelDia = formatDiaCorto(fecha);
  const [diaSemana, diaMes] = labelDia.split(" ");

  return (
    <div className="flex flex-col w-[150px] shrink-0 md:w-auto md:min-w-0">
      {/* Cabecera del día */}
      <div
        className={`mb-2 flex flex-col items-center rounded-xl py-2 text-center text-xs font-semibold transition-colors ${
          hoy
            ? "bg-marca/10 ring-1 ring-marca/20"
            : ""
        }`}
      >
        <span className={`uppercase tracking-widest text-[10px] ${hoy ? "text-marca" : "text-gray-400"}`}>
          {diaSemana}
        </span>
        <span className={`mt-0.5 text-xl font-bold ${hoy ? "text-marca" : "text-gray-800"}`}>
          {diaMes}
        </span>
      </div>

      {/* Zona droppable */}
      <div
        ref={setNodeRef}
        className={`
          flex-1 min-h-[480px] rounded-xl border p-2 space-y-2 transition-colors
          ${isOver
            ? "border-marca/40 bg-marca/5"
            : "border-gray-200 bg-gray-50"
          }
        `}
      >
        {pedidos.map((p) => (
          <TarjetaArrastrable key={p.id} pedido={p} onEdit={onEdit} onEntregar={onEntregar} onRevertir={onRevertir} onEliminar={onEliminar} />
        ))}
        {pedidos.length === 0 && (
          <div className="flex flex-col items-center pt-10 text-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Calendario principal ─────────────────────────────────────────────────────

interface Props {
  pedidos: Pedido[];
  onEdit: (p: Pedido) => void;
}

export default function CalendarioSemanal({ pedidos: initialPedidos, onEdit }: Props) {
  const [pedidos, setPedidos] = useState<Pedido[]>(initialPedidos);
  const [lunes, setLunes] = useState(() => lunesDeSemana(new Date()));
  const [arrastrandoPedido, setArrastrandoPedido] = useState<Pedido | null>(null);

  // Sincronizar cuando el servidor revalida y llegan nuevos props
  useEffect(() => {
    setPedidos(initialPedidos);
  }, [initialPedidos]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const dias = diasLaborables(lunes);
  const semanaStr = formatRangoSemana(lunes);

  // Pedidos de la semana visible (incluye todos los estados)
  const pedidosPorDia = (fecha: Date) =>
    pedidos.filter((p) => p.fecha_entrega === toDateStr(fecha));

  function irASemanaAnterior() {
    setLunes((l) => addDias(l, -7));
  }
  function irASemanaSiguiente() {
    setLunes((l) => addDias(l, 7));
  }
  function irASemanaActual() {
    setLunes(lunesDeSemana(new Date()));
  }

  function handleEntregar(pedidoId: string) {
    setPedidos((prev) =>
      prev.map((p) =>
        p.id === pedidoId ? { ...p, estado: "entregado" as EstadoPedido } : p
      )
    );
  }

  function handleRevertirExito(pedidoId: string) {
    setPedidos((prev) =>
      prev.map((p) =>
        p.id === pedidoId ? { ...p, estado: "confirmado" as EstadoPedido } : p
      )
    );
  }

  function handleEliminar(pedidoId: string) {
    setPedidos((prev) => prev.filter((p) => p.id !== pedidoId));
  }

  function handleDragStart(event: DragStartEvent) {
    const p = pedidos.find((x) => x.id === event.active.id);
    setArrastrandoPedido(p ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setArrastrandoPedido(null);

    if (!over) return;

    const pedidoId = active.id as string;
    const nuevaFecha = over.id as string;

    const pedido = pedidos.find((p) => p.id === pedidoId);
    if (!pedido || pedido.fecha_entrega === nuevaFecha) return;
    if (pedido.estado === "entregado" || pedido.estado === "cancelado") return;

    // Actualización optimista
    const pedidosAnteriores = pedidos;
    setPedidos((prev) =>
      prev.map((p) => (p.id === pedidoId ? { ...p, fecha_entrega: nuevaFecha } : p))
    );

    // Persistir en Supabase
    actualizarFechaEntrega(pedidoId, nuevaFecha).then((result) => {
      if (result.error) {
        // Revertir si falla
        setPedidos(pedidosAnteriores);
      }
    });
  }

  return (
    <div>
      {/* ── Navegación de semana ── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={irASemanaAnterior}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            ←
          </button>
          <button
            onClick={irASemanaSiguiente}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            →
          </button>
          <span className="text-sm font-semibold text-gray-800">{semanaStr}</span>
        </div>
        <button
          onClick={irASemanaActual}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
        >
          Hoy
        </button>
      </div>

      {/* ── Grid de días ── */}
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 md:grid md:grid-cols-5 md:overflow-visible md:mx-0 md:px-0 md:pb-0">
          {dias.map((dia) => (
            <ColumnaDroppable
              key={toDateStr(dia)}
              fecha={dia}
              pedidos={pedidosPorDia(dia)}
              onEdit={onEdit}
              onEntregar={handleEntregar}
              onRevertir={handleRevertirExito}
              onEliminar={handleEliminar}
            />
          ))}
        </div>

        {/* Tarjeta flotante mientras se arrastra */}
        <DragOverlay dropAnimation={null}>
          {arrastrandoPedido && (
            <div className="w-full">
              <ContenidoTarjeta pedido={arrastrandoPedido} overlay />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <p className="mt-3 text-xs text-gray-400 text-center">
        Arrastra las tarjetas entre columnas para cambiar la fecha de entrega · Clic para editar
      </p>
    </div>
  );
}
