"use client";

import { toDateStr } from "@/lib/semana";

interface Props {
  inicio: string | null;
  fin: string | null;
  onCambiar: (inicio: string | null, fin: string | null) => void;
}

const PRESETS = [
  { etiqueta: "Todo el historial", dias: null },
  { etiqueta: "Últimos 30 días", dias: 30 },
  { etiqueta: "Últimos 90 días", dias: 90 },
  { etiqueta: "Este año", dias: "anio" as const },
];

function calcularInicioPreset(dias: number | "anio" | null): string | null {
  if (dias === null) return null;
  const hoy = new Date();
  if (dias === "anio") return toDateStr(new Date(hoy.getFullYear(), 0, 1));
  const d = new Date(hoy);
  d.setDate(d.getDate() - dias);
  return toDateStr(d);
}

export default function FiltroFechas({ inicio, fin, onCambiar }: Props) {
  const presetActivo = (dias: number | "anio" | null) => {
    if (dias === null) return inicio === null && fin === null;
    return inicio === calcularInicioPreset(dias) && fin === null;
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between md:p-5">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.etiqueta}
            onClick={() => onCambiar(calcularInicioPreset(p.dias), null)}
            className={`min-h-9 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              presetActivo(p.dias)
                ? "bg-marca text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {p.etiqueta}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-500">
        <label className="flex items-center gap-1.5">
          Desde
          <input
            type="date"
            value={inicio ?? ""}
            onChange={(e) => onCambiar(e.target.value || null, fin)}
            className="min-h-9 rounded-lg border border-gray-300 px-2 py-1 text-sm text-gray-700 focus:border-marca focus:outline-none focus:ring-1 focus:ring-marca"
          />
        </label>
        <label className="flex items-center gap-1.5">
          Hasta
          <input
            type="date"
            value={fin ?? ""}
            onChange={(e) => onCambiar(inicio, e.target.value || null)}
            className="min-h-9 rounded-lg border border-gray-300 px-2 py-1 text-sm text-gray-700 focus:border-marca focus:outline-none focus:ring-1 focus:ring-marca"
          />
        </label>
      </div>
    </div>
  );
}
