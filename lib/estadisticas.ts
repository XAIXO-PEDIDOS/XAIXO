import type { Pedido } from "@/types/database";
import { toneladasFijasDePedido } from "@/lib/resumenSemanal";

// Mismos colores que ya se usan en el tablero y el calendario (ver
// tailwind.config.ts: franjo/david/trailer, y el morado añadido para
// Transporte cliente en TableroCamiones.tsx / CalendarioSemanal.tsx) — aquí
// hacen falta en hex plano porque los gráficos de recharts pintan con SVG
// `fill`, no con clases de Tailwind.
export const COLOR_MARCA = "#E5231B";
const COLOR_FRANJO = "#3B82F6";
const COLOR_DAVID = "#22C55E";
const COLOR_TRANSPORTE_CLIENTE = "#A855F7";
const COLOR_TRAILER = "#F97316";
const COLOR_SIN_ASIGNAR = "#9CA3AF";

// Mismo criterio de coincidencia por nombre que TableroCamiones/CalendarioSemanal.
export function colorPorCamion(nombre: string): string {
  const n = nombre.toLowerCase();
  if (n.includes("tráiler") || n.includes("trailer")) return COLOR_TRAILER;
  if (n.includes("franjo")) return COLOR_FRANJO;
  if (n.includes("david")) return COLOR_DAVID;
  if (n.includes("transporte cliente")) return COLOR_TRANSPORTE_CLIENTE;
  return COLOR_SIN_ASIGNAR;
}

export const COLOR_ENTREGADO = "#22C55E";
export const COLOR_PENDIENTE = "#CA8A04";
export const COLOR_CANCELADO = "#EF4444";

export interface RangoFechas {
  inicio: string | null; // YYYY-MM-DD, null = sin límite inferior
  fin: string | null; // YYYY-MM-DD, null = sin límite superior
}

export function filtrarPorRango(pedidos: Pedido[], rango: RangoFechas): Pedido[] {
  return pedidos.filter((p) => {
    if (rango.inicio && p.fecha_entrega < rango.inicio) return false;
    if (rango.fin && p.fecha_entrega > rango.fin) return false;
    return true;
  });
}

function nombreCamionDePedido(pedido: Pedido): string {
  if (pedido.tipo === "trailer_fabrica") return "Tráilers fábrica";
  return pedido.camiones?.nombre ?? "Sin asignar";
}

export interface PuntoToneladasMes {
  mes: string; // "ene 2026"
  claveOrden: string; // "2026-01", para ordenar cronológicamente
  toneladas: number;
}

/** Evolución de toneladas por mes — solo pedidos no cancelados. */
export function toneladasPorMes(pedidos: Pedido[]): PuntoToneladasMes[] {
  const porMes = new Map<string, number>();

  for (const p of pedidos) {
    if (p.estado === "cancelado") continue;
    const clave = p.fecha_entrega.slice(0, 7); // "YYYY-MM"
    porMes.set(clave, (porMes.get(clave) ?? 0) + toneladasFijasDePedido(p));
  }

  return Array.from(porMes.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([clave, toneladas]) => {
      const [anio, mes] = clave.split("-").map(Number);
      const label = new Date(anio, mes - 1, 1).toLocaleDateString("es-ES", {
        month: "short",
        year: "numeric",
      });
      return { mes: label, claveOrden: clave, toneladas: Math.round(toneladas * 100) / 100 };
    });
}

export interface ClientePedidos {
  cliente: string;
  pedidos: number;
}

/** Top N clientes por número de pedidos — no cancelados. */
export function topClientes(pedidos: Pedido[], n = 10): ClientePedidos[] {
  const porCliente = new Map<string, number>();
  for (const p of pedidos) {
    if (p.estado === "cancelado") continue;
    const nombre = p.cliente?.trim();
    if (!nombre) continue;
    porCliente.set(nombre, (porCliente.get(nombre) ?? 0) + 1);
  }
  return Array.from(porCliente.entries())
    .map(([cliente, pedidos]) => ({ cliente, pedidos }))
    .sort((a, b) => b.pedidos - a.pedidos)
    .slice(0, n);
}

export interface CargaCamion {
  nombre: string;
  toneladas: number;
  color: string;
}

/** Reparto de toneladas totales por camión — no cancelados, capacidad fija por viaje. */
export function repartoPorCamion(pedidos: Pedido[]): CargaCamion[] {
  const porCamion = new Map<string, number>();
  for (const p of pedidos) {
    if (p.estado === "cancelado") continue;
    const nombre = nombreCamionDePedido(p);
    const toneladas = toneladasFijasDePedido(p);
    if (toneladas <= 0) continue; // "Sin asignar" no aporta carga conocida
    porCamion.set(nombre, (porCamion.get(nombre) ?? 0) + toneladas);
  }
  return Array.from(porCamion.entries())
    .map(([nombre, toneladas]) => ({
      nombre,
      toneladas: Math.round(toneladas * 100) / 100,
      color: colorPorCamion(nombre),
    }))
    .sort((a, b) => b.toneladas - a.toneladas);
}

export interface MaterialVeces {
  material: string;
  veces: number;
}

/** Top N materiales por número de líneas de pedido (no por cantidad) — no cancelados. */
export function topMateriales(pedidos: Pedido[], n = 10): MaterialVeces[] {
  const porMaterial = new Map<string, { original: string; veces: number }>();
  for (const p of pedidos) {
    if (p.estado === "cancelado") continue;
    for (const m of p.materiales ?? []) {
      const nombre = m.material?.trim();
      if (!nombre) continue;
      const clave = nombre.toLowerCase();
      const actual = porMaterial.get(clave) ?? { original: nombre, veces: 0 };
      actual.veces += 1;
      porMaterial.set(clave, actual);
    }
  }
  return Array.from(porMaterial.values())
    .map(({ original, veces }) => ({ material: original, veces }))
    .sort((a, b) => b.veces - a.veces)
    .slice(0, n);
}

export interface DesgloseEstado {
  estado: string;
  cantidad: number;
  color: string;
}

/** Entregados vs pendientes (pendiente+confirmado) vs cancelados — todos los pedidos del rango. */
export function desgloseEstados(pedidos: Pedido[]): DesgloseEstado[] {
  let entregados = 0;
  let pendientes = 0;
  let cancelados = 0;

  for (const p of pedidos) {
    if (p.estado === "entregado") entregados += 1;
    else if (p.estado === "cancelado") cancelados += 1;
    else pendientes += 1; // pendiente | confirmado
  }

  return [
    { estado: "Entregados", cantidad: entregados, color: COLOR_ENTREGADO },
    { estado: "Pendientes", cantidad: pendientes, color: COLOR_PENDIENTE },
    { estado: "Cancelados", cantidad: cancelados, color: COLOR_CANCELADO },
  ].filter((d) => d.cantidad > 0);
}

export interface KpisEstadisticas {
  totalPedidos: number;
  toneladasTotales: number;
  clienteMasFrecuente: string | null;
  pctEntregados: number;
}

/** KPIs de cabecera — sobre todos los pedidos del rango (incluye cancelados en el total). */
export function calcularKpis(pedidos: Pedido[]): KpisEstadisticas {
  const totalPedidos = pedidos.length;

  let toneladasTotales = 0;
  let entregados = 0;
  const porCliente = new Map<string, number>();

  for (const p of pedidos) {
    if (p.estado !== "cancelado") toneladasTotales += toneladasFijasDePedido(p);
    if (p.estado === "entregado") entregados += 1;
    const nombre = p.cliente?.trim();
    if (nombre) porCliente.set(nombre, (porCliente.get(nombre) ?? 0) + 1);
  }

  let clienteMasFrecuente: string | null = null;
  let maxPedidos = 0;
  porCliente.forEach((n, nombre) => {
    if (n > maxPedidos) {
      maxPedidos = n;
      clienteMasFrecuente = nombre;
    }
  });

  return {
    totalPedidos,
    toneladasTotales: Math.round(toneladasTotales * 100) / 100,
    clienteMasFrecuente,
    pctEntregados: totalPedidos > 0 ? Math.round((entregados / totalPedidos) * 100) : 0,
  };
}
