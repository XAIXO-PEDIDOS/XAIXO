"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Pedido } from "@/types/database";
import {
  calcularKpis,
  desgloseEstados,
  filtrarPorRango,
  repartoPorCamion,
  toneladasPorMes,
  topClientes,
  topMateriales,
  type RangoFechas,
} from "@/lib/estadisticas";
import FiltroFechas from "./FiltroFechas";
import StatTile from "./StatTile";
import ChartCard from "./ChartCard";
import ToneladasPorMesChart from "./ToneladasPorMesChart";
import BarraHorizontal from "./BarraHorizontal";
import PieConLeyenda from "./PieConLeyenda";

interface Props {
  pedidos: Pedido[];
}

export default function EstadisticasView({ pedidos }: Props) {
  const [rango, setRango] = useState<RangoFechas>({ inicio: null, fin: null });

  const pedidosFiltrados = useMemo(() => filtrarPorRango(pedidos, rango), [pedidos, rango]);

  const kpis = useMemo(() => calcularKpis(pedidosFiltrados), [pedidosFiltrados]);
  const evolucionToneladas = useMemo(() => toneladasPorMes(pedidosFiltrados), [pedidosFiltrados]);
  const clientesTop = useMemo(() => topClientes(pedidosFiltrados, 10), [pedidosFiltrados]);
  const materialesTop = useMemo(() => topMateriales(pedidosFiltrados, 10), [pedidosFiltrados]);
  const cargaCamiones = useMemo(() => repartoPorCamion(pedidosFiltrados), [pedidosFiltrados]);
  const estados = useMemo(() => desgloseEstados(pedidosFiltrados), [pedidosFiltrados]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white px-4 py-3 md:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-32 shrink-0 md:h-11 md:w-44">
              <Image
                src="/logo-xaixo.png"
                alt="XAIXO Pedidos"
                fill
                className="object-contain object-left"
                priority
              />
            </div>
            <span className="hidden text-sm font-medium text-gray-300 md:inline">/</span>
            <h1 className="hidden text-sm font-semibold text-gray-700 md:inline">Estadísticas</h1>
          </div>
          <Link
            href="/dashboard"
            className="min-h-11 md:min-h-0 inline-flex items-center justify-center rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
          >
            ← Volver
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 md:text-2xl">Estadísticas avanzadas</h2>
          <p className="mt-1 text-sm text-gray-500">
            {pedidosFiltrados.length} pedido{pedidosFiltrados.length === 1 ? "" : "s"} en el rango
            seleccionado
          </p>
        </div>

        <div className="mb-6">
          <FiltroFechas
            inicio={rango.inicio}
            fin={rango.fin}
            onCambiar={(inicio, fin) => setRango({ inicio, fin })}
          />
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <StatTile icono="📦" etiqueta="Total pedidos" valor={String(kpis.totalPedidos)} />
          <StatTile icono="⚖️" etiqueta="Toneladas totales" valor={`${kpis.toneladasTotales} t`} />
          <StatTile
            icono="🏆"
            etiqueta="Cliente más frecuente"
            valor={kpis.clienteMasFrecuente ?? "—"}
          />
          <StatTile icono="✅" etiqueta="Pedidos entregados" valor={`${kpis.pctEntregados}%`} />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          <ChartCard
            titulo="Evolución de toneladas por mes"
            subtitulo="Suma de la capacidad fija de cada viaje, pedidos no cancelados"
            className="md:col-span-2"
          >
            <ToneladasPorMesChart datos={evolucionToneladas} />
          </ChartCard>

          <ChartCard titulo="Top 10 clientes" subtitulo="Por número de pedidos, no cancelados">
            <BarraHorizontal
              datos={clientesTop.map((c) => ({ etiqueta: c.cliente, valor: c.pedidos }))}
              nombreValor="Pedidos"
            />
          </ChartCard>

          <ChartCard
            titulo="Reparto de carga por camión"
            subtitulo="% de las toneladas totales, pedidos no cancelados"
          >
            <PieConLeyenda
              datos={cargaCamiones.map((c) => ({ nombre: c.nombre, valor: c.toneladas, color: c.color }))}
              formatoValor={(v) => `${v} t`}
            />
          </ChartCard>

          <ChartCard
            titulo="Top 10 materiales más pedidos"
            subtitulo="Por número de líneas de pedido, no cancelados"
          >
            <BarraHorizontal
              datos={materialesTop.map((m) => ({ etiqueta: m.material, valor: m.veces }))}
              nombreValor="Veces"
            />
          </ChartCard>

          <ChartCard titulo="Entregados vs pendientes/cancelados" subtitulo="Todos los pedidos del rango">
            <PieConLeyenda
              datos={estados.map((e) => ({ nombre: e.estado, valor: e.cantidad, color: e.color }))}
              formatoValor={(v) => `${v} pedido${v === 1 ? "" : "s"}`}
            />
          </ChartCard>
        </div>
      </main>
    </div>
  );
}
