"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { COLOR_MARCA } from "@/lib/estadisticas";
import EmptyState from "./EmptyState";

interface Item {
  etiqueta: string;
  valor: number;
}

interface Props {
  datos: Item[];
  nombreValor: string;
}

function truncar(texto: string, max: number): string {
  return texto.length > max ? `${texto.slice(0, max - 1)}…` : texto;
}

export default function BarraHorizontal({ datos, nombreValor }: Props) {
  if (datos.length === 0) return <EmptyState />;

  const altura = Math.max(220, datos.length * 34);

  return (
    <ResponsiveContainer width="100%" height={altura}>
      <BarChart data={datos} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke="#e1e0d9" />
        <XAxis
          type="number"
          allowDecimals={false}
          tick={{ fontSize: 12, fill: "#898781" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="etiqueta"
          width={170}
          tick={{ fontSize: 12, fill: "#52514e" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: string) => truncar(v, 24)}
        />
        <Tooltip
          cursor={{ fill: "#f9f9f7" }}
          contentStyle={{ borderRadius: 8, border: "1px solid #e1e0d9", fontSize: 13 }}
          labelStyle={{ color: "#0b0b0b", fontWeight: 600 }}
          formatter={(value) => [`${value}`, nombreValor]}
        />
        <Bar dataKey="valor" fill={COLOR_MARCA} radius={[0, 4, 4, 0]} maxBarSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
}
