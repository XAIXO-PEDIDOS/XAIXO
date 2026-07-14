import type { Pedido } from "@/types/database";
import { toDateStr } from "./semana";

// IMPORTANTE — no usar emojis pictográficos (📋🔵🟢🟠⚠️✅📦🏆🔥) aquí.
// No es un problema de codificación del archivo: comprobado contra el
// endpoint real (curl siguiendo la redirección 302 de https://wa.me/...),
// WhatsApp sustituye esos caracteres por U+FFFD ("�") en el propio
// `Location` de la redirección, antes de que el mensaje llegue a mostrarse.
// Es un filtro del lado de WhatsApp, no algo que se pueda arreglar desde
// nuestro código. Los símbolos de abajo sí sobreviven esa redirección
// (verificado el mismo modo) — flechas, formas geométricas simples y el
// check "✓" — y las cabeceras de sección usan *negrita* nativa de
// WhatsApp (asteriscos) en vez de un icono.
const SIMBOLOS = {
  subida: "\u{2191}", // ↑
  bajada: "\u{2193}", // ↓
  igual: "\u{2192}", // →
  circulo: "\u{25CF}", // ● (primer camión)
  cuadrado: "\u{25A0}", // ■ (segundo camión)
  diamante: "\u{25C6}", // ◆ (resto de camiones)
  triangulo: "\u{25B2}", // ▲ (tráilers fábrica)
  check: "\u{2713}", // ✓ (todo entregado)
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
  trailerFabricaToneladas: number;
  pendientesSinEntregar: number;
  toneladasTotal: number;
  topClientes: ResumenCliente[];
  materialesTop: ResumenMaterial[];
}

// Cada camión sale siempre a plena carga, así que un pedido (viaje) cuenta
// como la capacidad fija de su camión — no como la suma de lo que lleva.
// Convertir unidades de material (sacos, palets, big bags...) a peso no era
// fiable, así que ya no se usa para calcular toneladas.
const CAPACIDAD_TRAILER_FABRICA_TONELADAS = 24;

export function toneladasFijasDePedido(pedido: Pedido): number {
  if (pedido.tipo === "trailer_fabrica") return CAPACIDAD_TRAILER_FABRICA_TONELADAS;
  return pedido.camiones?.capacidad_toneladas ?? 0;
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
  let trailerFabricaToneladas = 0;
  let pendientesSinEntregar = 0;
  let toneladasTotal = 0;

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
    }

    const toneladas = toneladasFijasDePedido(p);
    toneladasTotal += toneladas;

    if (p.tipo === "trailer_fabrica") {
      trailerFabrica += 1;
      trailerFabricaToneladas += toneladas;
      continue;
    }

    const nombreCamion = p.camiones?.nombre ?? "Sin asignar";
    const actualCamion = porCamionMap.get(nombreCamion) ?? { nombre: nombreCamion, pedidos: 0, toneladas: 0 };
    actualCamion.pedidos += 1;
    actualCamion.toneladas += toneladas;
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
    trailerFabricaToneladas,
    pendientesSinEntregar,
    toneladasTotal,
    topClientes,
    materialesTop,
  };
}

function simboloCamion(nombre: string): string {
  const n = nombre.toLowerCase();
  if (n.includes("franjo")) return SIMBOLOS.circulo;
  if (n.includes("david")) return SIMBOLOS.cuadrado;
  return SIMBOLOS.diamante;
}

function formatToneladas(n: number): string {
  return parseFloat(n.toFixed(2)).toString();
}

function formatKg(kg: number): string {
  // useGrouping debe ir explícito: en Node/V8 el valor por defecto de
  // toLocaleString() no siempre agrupa los miles aunque el locale es-ES
  // esté disponible (probado: sin esta opción, 6875 se queda en "6875"
  // en vez de "6.875").
  return Math.round(kg).toLocaleString("es-ES", { useGrouping: true });
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
      ? `${SIMBOLOS.subida} +${diff} pedidos vs semana pasada`
      : diff < 0
      ? `${SIMBOLOS.bajada} ${diff} pedidos vs semana pasada`
      : `${SIMBOLOS.igual} igual que la semana pasada`;

  const lineas: string[] = [
    `*Resumen semana ${rangoLabel}*`,
    lineaComparacion,
    "",
    `Total pedidos: ${resumen.totalPedidos}`,
  ];

  for (const c of resumen.porCamion) {
    const toneladasTxt = c.toneladas > 0 ? ` (${formatToneladas(c.toneladas)}t)` : "";
    lineas.push(
      `${simboloCamion(c.nombre)} ${c.nombre}: ${c.pedidos} pedido${c.pedidos === 1 ? "" : "s"}${toneladasTxt}`
    );
  }

  if (resumen.trailerFabrica > 0) {
    lineas.push(
      `${SIMBOLOS.triangulo} Tráilers fábrica: ${resumen.trailerFabrica} (${formatToneladas(resumen.trailerFabricaToneladas)}t)`
    );
  }

  lineas.push(
    resumen.pendientesSinEntregar > 0
      ? `! Pendientes de entregar: ${resumen.pendientesSinEntregar}`
      : `${SIMBOLOS.check} Todo entregado`
  );

  if (resumen.toneladasTotal > 0) {
    lineas.push("");
    // Ya no es material pesado línea a línea: es la suma de la capacidad
    // fija de cada viaje (ver toneladasFijasDePedido), convertida a kg solo
    // para mantener el mismo formato de línea que ya conocía el equipo.
    lineas.push(`*Material suministrado:* ${formatKg(resumen.toneladasTotal * 1000)} kg`);
  }

  if (resumen.topClientes.length > 0) {
    lineas.push("");
    lineas.push("*Top clientes:*");
    resumen.topClientes.forEach((c, i) => {
      lineas.push(`${i + 1}. ${c.nombre} (${c.pedidos} pedido${c.pedidos === 1 ? "" : "s"})`);
    });
  }

  if (resumen.materialesTop.length > 0) {
    lineas.push("");
    lineas.push("*Materiales más pedidos:*");
    lineas.push(resumen.materialesTop.map((m) => `${m.material} (${m.veces})`).join(", "));
  }

  return lineas.join("\n");
}
