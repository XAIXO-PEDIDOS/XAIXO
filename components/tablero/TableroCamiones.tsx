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
import type { Camion, EstadoPedido, Pedido } from "@/types/database";
import { actualizarCamion } from "@/app/dashboard/actions";
import BotonEntregar from "@/components/pedidos/BotonEntregar";
import BotonRevertirEntregado from "@/components/pedidos/BotonRevertirEntregado";
import BotonEliminar from "@/components/pedidos/BotonEliminar";

// ─── Helpers de color ─────────────────────────────────────────────────────────

function coloresPedido(pedido: Pedido) {
  if (pedido.tipo === "trailer_fabrica")
    return { bg: "bg-orange-50", border: "border-orange-300", texto: "text-orange-700" };
  const nombre = pedido.camiones?.nombre?.toLowerCase() ?? "";
  if (nombre.includes("franjo"))
    return { bg: "bg-blue-50", border: "border-blue-300", texto: "text-blue-700" };
  if (nombre.includes("david"))
    return { bg: "bg-green-50", border: "border-green-300", texto: "text-green-700" };
  if (nombre.includes("transporte cliente"))
    return { bg: "bg-purple-50", border: "border-purple-300", texto: "text-purple-700" };
  return { bg: "bg-gray-50", border: "border-gray-300", texto: "text-gray-500" };
}

function coloresColumna(columnId: string, camiones: Camion[]) {
  if (columnId === "trailer")
    return { accent: "border-t-orange-400", header: "text-orange-700" };
  if (columnId === "sin_asignar")
    return { accent: "border-t-gray-300", header: "text-gray-500" };
  const camion = camiones.find((c) => c.id === columnId);
  const nombre = camion?.nombre?.toLowerCase() ?? "";
  if (nombre.includes("franjo"))
    return { accent: "border-t-blue-400", header: "text-blue-700" };
  if (nombre.includes("david"))
    return { accent: "border-t-green-400", header: "text-green-700" };
  if (nombre.includes("transporte cliente"))
    return { accent: "border-t-purple-400", header: "text-purple-700" };
  return { accent: "border-t-gray-300", header: "text-gray-700" };
}

function resumenMateriales(pedido: Pedido): string {
  const mats = pedido.materiales ?? [];
  if (mats.length === 0) return "";
  const { material, cantidad, unidad } = mats[0];
  const label = [cantidad != null ? cantidad : "", unidad || "", material]
    .filter(Boolean)
    .join(" ");
  return mats.length > 1 ? `${label} +${mats.length - 1}` : label;
}

// ─── Contenido de tarjeta ─────────────────────────────────────────────────────

function ContenidoTarjeta({
  pedido,
  overlay = false,
  onEntregar,
  onRevertir,
  onEliminar,
  onVer,
}: {
  pedido: Pedido;
  overlay?: boolean;
  onEntregar?: (pedidoId: string) => void;
  onRevertir?: (pedidoId: string) => void;
  onEliminar?: (pedidoId: string) => void;
  onVer?: (pedido: Pedido) => void;
}) {
  const bloqueado = pedido.estado === "entregado" || pedido.estado === "cancelado";
  const { bg, border, texto } = coloresPedido(pedido);
  const borde = pedido.estado === "pendiente" ? "border-dashed" : "border-solid";

  const fecha = new Date(pedido.fecha_entrega + "T00:00:00").toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

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

      {/* Fecha — clave en esta vista */}
      <p className={`mt-0.5 font-medium ${texto}`}>{fecha}</p>

      {resumenMateriales(pedido) && (
        <p className="mt-0.5 text-gray-500 truncate">{resumenMateriales(pedido)}</p>
      )}

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
      {!overlay && onVer && (
        <div className="mt-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onVer(pedido)}
            className="w-full rounded border border-gray-200 bg-white py-0.5 text-[10px] font-medium text-gray-500 hover:bg-gray-50 transition-colors"
          >
            👁 Ver
          </button>
        </div>
      )}

      {/* Estado badge */}
      {pedido.estado !== "pendiente" && (
        <span
          className={`mt-1 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
            pedido.estado === "confirmado"
              ? "bg-blue-100 text-blue-700"
              : pedido.estado === "entregado"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {pedido.estado}
        </span>
      )}
    </div>
  );
}

// ─── Tarjeta arrastrable ──────────────────────────────────────────────────────

function TarjetaArrastrable({
  pedido,
  onEdit,
  onEntregar,
  onRevertir,
  onEliminar,
  onVer,
}: {
  pedido: Pedido;
  onEdit: (p: Pedido) => void;
  onEntregar: (pedidoId: string) => void;
  onRevertir: (pedidoId: string) => void;
  onEliminar: (pedidoId: string) => void;
  onVer: (p: Pedido) => void;
}) {
  // trailer_fabrica y bloqueados no se pueden arrastrar
  const bloqueado = pedido.estado === "entregado" || pedido.estado === "cancelado";
  const esTrailer = pedido.tipo === "trailer_fabrica";

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: pedido.id,
    disabled: bloqueado || esTrailer,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0 : 1,
    touchAction: "none",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(!bloqueado && !esTrailer ? listeners : {})}
      {...attributes}
      onClick={() => onEdit(pedido)}
      title={
        esTrailer
          ? "Los tráilers de fábrica no se reasignan · Clic para editar"
          : bloqueado
          ? "Pedido bloqueado · Clic para ver"
          : "Arrastrar para cambiar camión · Clic para editar"
      }
      className={
        bloqueado || esTrailer ? "cursor-default" : "cursor-grab active:cursor-grabbing"
      }
    >
      <ContenidoTarjeta pedido={pedido} onEntregar={onEntregar} onRevertir={onRevertir} onEliminar={onEliminar} onVer={onVer} />
    </div>
  );
}

// ─── Columna droppable ────────────────────────────────────────────────────────

interface ColumnaProps {
  columnId: string;
  titulo: string;
  subtitulo?: string;
  pedidos: Pedido[];
  onEdit: (p: Pedido) => void;
  onEntregar: (pedidoId: string) => void;
  onRevertir: (pedidoId: string) => void;
  onEliminar: (pedidoId: string) => void;
  onVer: (p: Pedido) => void;
  camiones: Camion[];
  puedeRecibir: boolean;
}

function ColumnaDroppable({
  columnId,
  titulo,
  subtitulo,
  pedidos,
  onEdit,
  onEntregar,
  onRevertir,
  onEliminar,
  onVer,
  camiones,
  puedeRecibir,
}: ColumnaProps) {
  const { setNodeRef, isOver } = useDroppable({ id: columnId });
  const { accent, header } = coloresColumna(columnId, camiones);

  const bgActivo = isOver && puedeRecibir ? "border-blue-400 bg-blue-50" : "";
  const bgForbidden = isOver && !puedeRecibir ? "border-red-300 bg-red-50/50" : "";
  const bgDefault = !isOver ? "border-gray-200 bg-white/60" : "";

  return (
    <div className="flex flex-col w-[150px] shrink-0 md:w-auto md:min-w-0">
      {/* Cabecera */}
      <div className={`mb-2 rounded-lg border-t-4 bg-white px-3 py-2 shadow-sm ${accent}`}>
        <div className="flex items-center justify-between gap-1">
          <span className={`font-semibold text-sm ${header}`}>{titulo}</span>
          <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
            {pedidos.length}
          </span>
        </div>
        {subtitulo && (
          <p className="mt-0.5 text-[11px] text-gray-400">{subtitulo}</p>
        )}
      </div>

      {/* Zona droppable */}
      <div
        ref={setNodeRef}
        className={`
          flex-1 min-h-96 rounded-xl border-2 border-dashed p-2 space-y-2 transition-colors
          ${bgActivo || bgForbidden || bgDefault}
        `}
      >
        {pedidos.map((p) => (
          <TarjetaArrastrable key={p.id} pedido={p} onEdit={onEdit} onEntregar={onEntregar} onRevertir={onRevertir} onEliminar={onEliminar} onVer={onVer} />
        ))}
        {pedidos.length === 0 && (
          <p className="pt-8 text-center text-xs text-gray-300">—</p>
        )}
        {isOver && !puedeRecibir && (
          <p className="text-center text-xs text-red-400 mt-2">No permitido aquí</p>
        )}
      </div>
    </div>
  );
}

// ─── Tablero principal ────────────────────────────────────────────────────────

interface Props {
  pedidos: Pedido[];
  camiones: Camion[];
  onEdit: (p: Pedido) => void;
  onVer: (p: Pedido) => void;
}

export default function TableroCamiones({ pedidos: initialPedidos, camiones, onEdit, onVer }: Props) {
  const [pedidos, setPedidos] = useState<Pedido[]>(initialPedidos);
  const [arrastrandoPedido, setArrastrandoPedido] = useState<Pedido | null>(null);

  useEffect(() => {
    setPedidos(initialPedidos);
  }, [initialPedidos]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  // Definición de columnas: Sin asignar | [camiones] | Tráilers fábrica
  type ColDef = { id: string; titulo: string; subtitulo?: string };
  const columnas: ColDef[] = [
    { id: "sin_asignar", titulo: "Sin asignar" },
    ...camiones.map((c) => ({
      id: c.id,
      titulo: c.nombre,
      subtitulo: [
        c.capacidad_toneladas ? `${c.capacidad_toneladas}t` : null,
        c.chofer_habitual || null,
      ]
        .filter(Boolean)
        .join(" · "),
    })),
    { id: "trailer", titulo: "Tráilers fábrica" },
  ];

  function pedidosPorColumna(colId: string): Pedido[] {
    if (colId === "sin_asignar")
      return pedidos.filter((p) => p.tipo === "porte_propio" && !p.camion_id);
    if (colId === "trailer")
      return pedidos.filter((p) => p.tipo === "trailer_fabrica");
    return pedidos.filter((p) => p.camion_id === colId);
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
    const targetCol = over.id as string;
    const pedido = pedidos.find((p) => p.id === pedidoId);
    if (!pedido) return;

    // trailer_fabrica nunca se mueve
    if (pedido.tipo === "trailer_fabrica") return;
    // porte_propio no puede ir a la columna de tráilers
    if (targetCol === "trailer") return;

    const nuevoCamionId = targetCol === "sin_asignar" ? null : targetCol;
    const camionActual = pedido.camion_id ?? null;
    if (camionActual === nuevoCamionId) return;

    // Optimista
    const anterior = pedidos;
    setPedidos((prev) =>
      prev.map((p) =>
        p.id === pedidoId
          ? { ...p, camion_id: nuevoCamionId }
          : p
      )
    );

    actualizarCamion(pedidoId, nuevoCamionId).then((res) => {
      if (res.error) setPedidos(anterior);
    });
  }

  // ¿Puede la columna recibir el pedido que se está arrastrando?
  function columnaAceptaDrop(colId: string): boolean {
    if (!arrastrandoPedido) return true;
    if (arrastrandoPedido.tipo === "trailer_fabrica") return colId === "trailer";
    return colId !== "trailer";
  }

  return (
    <div>
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 md:grid md:overflow-visible md:mx-0 md:px-0 md:pb-0"
          style={{ gridTemplateColumns: `repeat(${columnas.length}, minmax(0, 1fr))` }}
        >
          {columnas.map((col) => (
            <ColumnaDroppable
              key={col.id}
              columnId={col.id}
              titulo={col.titulo}
              subtitulo={col.subtitulo}
              pedidos={pedidosPorColumna(col.id)}
              onEdit={onEdit}
              onEntregar={handleEntregar}
              onRevertir={handleRevertirExito}
              onEliminar={handleEliminar}
              onVer={onVer}
              camiones={camiones}
              puedeRecibir={columnaAceptaDrop(col.id)}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {arrastrandoPedido && (
            <div className="w-52">
              <ContenidoTarjeta pedido={arrastrandoPedido} overlay />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <p className="mt-3 text-xs text-gray-400 text-center">
        Arrastra las tarjetas entre columnas para cambiar el camión asignado · Clic para editar
      </p>
    </div>
  );
}
