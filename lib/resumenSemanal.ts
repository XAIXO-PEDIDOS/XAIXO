import type { Pedido } from "@/types/database";
import { toDateStr } from "./semana";

// Los emojis se construyen a partir de su punto de código Unicode (\u{...})
// en vez de pegar el carácter literal en el archivo. Un emoji "literal" son
// varios bytes UTF-8 guardados en disco: si algún paso de la cadena (editor,
// git, el bundler) toca el archivo con una codificación que no sea UTF-8,
// esos bytes se corrompen y WhatsApp los recibe como "�". Un escape \u{...}
// es ASCII puro, así que no hay bytes multibyte que corromper: el motor de
// JS siempre construye el mismo carácter sin importar cómo esté guardado
// el archivo.
const EMOJI = {
  clipboard: "\u{1F4CB}", // 📋
  azul: "\u{1F535}", // 🔵
  verde: "\u{1F7E2}", // 🟢
  blanco: "\u{26AA}", // ⚪
  naranja: "\u{1F7E0}", // 🟠
  advertencia: "\u{26A0}\u{FE0F}", // ⚠️
  check: "\u{2705}", // ✅
  paquete: "\u{1F4E6}", // 📦
  trofeo: "\u{1F3C6}", // 🏆
  fuego: "\u{1F525}", // 🔥
  subida: "\u{2191}", // ↑
  bajada: "\u{2193}", // ↓
  igual: "\u{2192}", // →
} as const;

export interface ResumenCamion {
  nombre: string;
  pedidos: number;
  toneladas: number;
}

export interface ResumenCliente {
  nombre: string;
  pedidos: number;
}

export interface ResumenMaterial {
  material: string;
  veces: number;
}

export interface ResumenSemanal {
  totalPedidos: number;
  porCamion: ResumenCamion[];
  trailerFabrica: number;
  pendientesSinEntregar: number;
  kgTotal: number;
  topClientes: ResumenCliente[];
  materialesTop: ResumenMaterial[];
}

// Peso en kg que representa una unidad de cada material conocido.
// Unidades no listadas aquí (m2, m3, ud, rollo…) no se pueden convertir
// a peso, así que no cuentan para los totales en kg/toneladas.
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
  const clientesMap = new Map<string, number>();
  const materialesMap = new Map<string, { original: string; veces: number }>();
  let trailerFabrica = 0;
  let pendientesSinEntregar = 0;
  let kgTotal = 0;

  for (const p of pedidosSemana) {
    if (p.estado !== "entregado") pendientesSinEntregar += 1;

    const clienteNombre = p.cliente?.trim();
    if (clienteNombre) {
      clientesMap.set(clienteNombre, (clientesMap.get(clienteNombre) ?? 0) + 1);
    }

    for (const m of p.materiales ?? []) {
      const nombreMaterial = m.material?.trim();
      if (nombreMaterial) {
        const clave = nombreMaterial.toLowerCase();
        const actual = materialesMap.get(clave) ?? { original: nombreMaterial, veces: 0 };
        actual.veces += 1;
        materialesMap.set(clave, actual);
      }

      const kg = kgPorUnidad(m.unidad);
      if (m.cantidad != null && kg != null) {
        kgTotal += m.cantidad * kg;
      }
    }

    if (p.tipo === "trailer_fabrica") {
      trailerFabrica += 1;
      continue;
    }

    const nombreCamion = p.camiones?.nombre ?? "Sin asignar";
    const actualCamion = porCamionMap.get(nombreCamion) ?? { nombre: nombreCamion, pedidos: 0, toneladas: 0 };
    actualCamion.pedidos += 1;
    actualCamion.toneladas += toneladasDePedido(p);
    porCamionMap.set(nombreCamion, actualCamion);
  }

  const topClientes = Array.from(clientesMap.entries())
    .map(([nombre, pedidos]) => ({ nombre, pedidos }))
    .sort((a, b) => b.pedidos - a.pedidos)
    .slice(0, 5);

  const materialesTop = Array.from(materialesMap.values())
    .map(({ original, veces }) => ({ material: original, veces }))
    .sort((a, b) => b.veces - a.veces)
    .slice(0, 3);

  return {
    totalPedidos: pedidosSemana.length,
    porCamion: Array.from(porCamionMap.values()).sort((a, b) => b.pedidos - a.pedidos),
    trailerFabrica,
    pendientesSinEntregar,
    kgTotal,
    topClientes,
    materialesTop,
  };
}

function emojiCamion(nombre: string): string {
  const n = nombre.toLowerCase();
  if (n.includes("franjo")) return EMOJI.azul;
  if (n.includes("david")) return EMOJI.verde;
  return EMOJI.blanco;
}

function formatToneladas(n: number): string {
  return parseFloat(n.toFixed(2)).toString();
}

function formatKg(kg: number): string {
  return Math.round(kg).toLocaleString("es-ES");
}

/**
 * Genera el texto plano del resumen, listo para pegar/enviar por WhatsApp.
 * `totalSemanaAnterior` es el total de pedidos de la semana previa, para
 * mostrar la comparación (↑/↓/→).
 */
export function formatearResumenSemanal(
  resumen: ResumenSemanal,
  rangoLabel: string,
  totalSemanaAnterior: number
): string {
  const diff = resumen.totalPedidos - totalSemanaAnterior;
  const lineaComparacion =
    diff > 0
      ? `${EMOJI.subida} +${diff} pedidos vs semana pasada`
      : diff < 0
      ? `${EMOJI.bajada} ${diff} pedidos vs semana pasada`
      : `${EMOJI.igual} igual que la semana pasada`;

  const lineas: string[] = [
    `${EMOJI.clipboard} Resumen semana ${rangoLabel}`,
    lineaComparacion,
    "",
    `Total pedidos: ${resumen.totalPedidos}`,
  ];

  for (const c of resumen.porCamion) {
    const toneladasTxt = c.toneladas > 0 ? ` (${formatToneladas(c.toneladas)}t)` : "";
    lineas.push(
      `${emojiCamion(c.nombre)} ${c.nombre}: ${c.pedidos} pedido${c.pedidos === 1 ? "" : "s"}${toneladasTxt}`
    );
  }

  if (resumen.trailerFabrica > 0) {
    lineas.push(`${EMOJI.naranja} Tráilers fábrica: ${resumen.trailerFabrica}`);
  }

  lineas.push(
    resumen.pendientesSinEntregar > 0
      ? `${EMOJI.advertencia} Pendientes de entregar: ${resumen.pendientesSinEntregar}`
      : `${EMOJI.check} Todo entregado`
  );

  if (resumen.kgTotal > 0) {
    lineas.push("");
    lineas.push(`${EMOJI.paquete} Material suministrado: ${formatKg(resumen.kgTotal)} kg`);
  }

  if (resumen.topClientes.length > 0) {
    lineas.push("");
    lineas.push(`${EMOJI.trofeo} Top clientes:`);
    resumen.topClientes.forEach((c, i) => {
      lineas.push(`${i + 1}. ${c.nombre} (${c.pedidos} pedido${c.pedidos === 1 ? "" : "s"})`);
    });
  }

  if (resumen.materialesTop.length > 0) {
    lineas.push("");
    lineas.push(`${EMOJI.fuego} Materiales más pedidos:`);
    lineas.push(resumen.materialesTop.map((m) => `${m.material} (${m.veces})`).join(", "));
  }

  return lineas.join("\n");
}
