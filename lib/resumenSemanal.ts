import type { Pedido } from "@/types/database";
import { toDateStr } from "./semana";

export interface ResumenCamion {
  nombre: string;
  pedidos: number;
  toneladas: number;
}

export interface ResumenSemanal {
  totalPedidos: number;
  porCamion: ResumenCamion[];
  trailerFabrica: number;
  pendientesSinEntregar: number;
}

// Peso en kg que representa una unidad de cada material conocido.
// Unidades no listadas aquí (m2, m3, ud, rollo…) no se pueden convertir
// a peso, así que no cuentan para el total de toneladas.
const KG_POR_UNIDAD: Record<string, number> = {
  // Toneladas directas
  t: 1000,
  tn: 1000,
  ton: 1000,
  tons: 1000,
  tonelada: 1000,
  toneladas: 1000,
  // Sacos
  saco: 25,
  sacos: 25,
  // Big bags
  "big bag": 750,
  "big bags": 750,
  bigbag: 750,
  bigbags: 750,
  "big-bag": 750,
  "big-bags": 750,
  // Kilos
  kg: 1,
  kilo: 1,
  kilos: 1,
};

function kgPorUnidad(unidad: string | null | undefined): number | null {
  if (!unidad) return null;
  const normalizada = unidad.trim().toLowerCase();
  return KG_POR_UNIDAD[normalizada] ?? null;
}

function toneladasDePedido(pedido: Pedido): number {
  return (pedido.materiales ?? []).reduce((acc, m) => {
    const kg = kgPorUnidad(m.unidad);
    if (m.cantidad == null || kg == null) return acc;
    return acc + (m.cantidad * kg) / 1000;
  }, 0);
}

/** Calcula el resumen operativo de los pedidos cuya fecha_entrega cae en `dias`. */
export function calcularResumenSemanal(pedidos: Pedido[], dias: Date[]): ResumenSemanal {
  const fechas = new Set(dias.map(toDateStr));
  const pedidosSemana = pedidos.filter(
    (p) => fechas.has(p.fecha_entrega) && p.estado !== "cancelado"
  );

  const porCamionMap = new Map<string, ResumenCamion>();
  let trailerFabrica = 0;
  let pendientesSinEntregar = 0;

  for (const p of pedidosSemana) {
    if (p.estado !== "entregado") pendientesSinEntregar += 1;

    if (p.tipo === "trailer_fabrica") {
      trailerFabrica += 1;
      continue;
    }

    const nombre = p.camiones?.nombre ?? "Sin asignar";
    const actual = porCamionMap.get(nombre) ?? { nombre, pedidos: 0, toneladas: 0 };
    actual.pedidos += 1;
    actual.toneladas += toneladasDePedido(p);
    porCamionMap.set(nombre, actual);
  }

  return {
    totalPedidos: pedidosSemana.length,
    porCamion: Array.from(porCamionMap.values()).sort((a, b) => b.pedidos - a.pedidos),
    trailerFabrica,
    pendientesSinEntregar,
  };
}

function emojiCamion(nombre: string): string {
  const n = nombre.toLowerCase();
  if (n.includes("franjo")) return "🔵";
  if (n.includes("david")) return "🟢";
  return "⚪";
}

function formatToneladas(n: number): string {
  return parseFloat(n.toFixed(2)).toString();
}

/** Genera el texto plano del resumen, listo para pegar/enviar por WhatsApp. */
export function formatearResumenSemanal(resumen: ResumenSemanal, rangoLabel: string): string {
  const lineas: string[] = [`📋 Resumen semana ${rangoLabel}`, "", `Total pedidos: ${resumen.totalPedidos}`];

  for (const c of resumen.porCamion) {
    const toneladasTxt = c.toneladas > 0 ? ` (${formatToneladas(c.toneladas)}t)` : "";
    lineas.push(`${emojiCamion(c.nombre)} ${c.nombre}: ${c.pedidos} pedido${c.pedidos === 1 ? "" : "s"}${toneladasTxt}`);
  }

  if (resumen.trailerFabrica > 0) {
    lineas.push(`🟠 Tráilers fábrica: ${resumen.trailerFabrica}`);
  }

  lineas.push("");
  lineas.push(
    resumen.pendientesSinEntregar > 0
      ? `⚠️ Pendientes de entregar: ${resumen.pendientesSinEntregar}`
      : "✅ Todo entregado"
  );

  return lineas.join("\n");
}
