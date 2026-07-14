"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import EmptyState from "./EmptyState";

interface Item {
  nombre: string;
  valor: number;
  color: string;
}

interface Props {
  datos: Item[];
  formatoValor: (valor: number) => string;
}

// Reutilizado por "Reparto de carga por camión" y "Entregados vs
// pendientes/cancelados" — ambas son gráficas de tarta parte-todo con color
// por categoría, así que comparten el mismo componente. El porcentaje va
// directamente sobre cada porción (label) y el nombre + valor exacto van en
// la leyenda de debajo con su punto de color: la identidad de cada porción
// nunca depende solo del color (ver validate_palette.js — el contraste de
// algunos tonos contra el fondo blanco no llega a 3:1 por sí solo).
export default function PieConLeyenda({ datos, formatoValor }: Props) {
  if (datos.length === 0) return <EmptyState />;

  return (
    <div>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={datos}
            dataKey="valor"
            nameKey="nombre"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            label={({ percent }) => `${Math.round((percent ?? 0) * 100)}%`}
          >
            {datos.map((d) => (
              <Cell key={d.nombre} fill={d.color} stroke="#fcfcfb" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ borderRadius: 8, border: "1px solid #e1e0d9", fontSize: 13 }}
            labelStyle={{ color: "#0b0b0b", fontWeight: 600 }}
            formatter={(value, _nombre, entry) => [
              formatoValor(Number(value)),
              (entry?.payload as Item | undefined)?.nombre ?? "",
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
      <ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-sm">
        {datos.map((d) => (
          <li key={d.nombre} className="flex items-center gap-1.5 text-gray-700">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
            {d.nombre} · <span className="font-medium">{formatoValor(d.valor)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
