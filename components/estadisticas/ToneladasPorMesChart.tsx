"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { COLOR_MARCA, type PuntoToneladasMes } from "@/lib/estadisticas";
import EmptyState from "./EmptyState";

export default function ToneladasPorMesChart({ datos }: { datos: PuntoToneladasMes[] }) {
  if (datos.length === 0) return <EmptyState />;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={datos} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#e1e0d9" />
        <XAxis
          dataKey="mes"
          tick={{ fontSize: 12, fill: "#898781" }}
          axisLine={{ stroke: "#c3c2b7" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "#898781" }}
          axisLine={false}
          tickLine={false}
          width={36}
          allowDecimals={false}
        />
        <Tooltip
          cursor={{ fill: "#f9f9f7" }}
          contentStyle={{ borderRadius: 8, border: "1px solid #e1e0d9", fontSize: 13 }}
          labelStyle={{ color: "#0b0b0b", fontWeight: 600 }}
          formatter={(value) => [`${value} t`, "Toneladas"]}
        />
        <Bar dataKey="toneladas" fill={COLOR_MARCA} radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}
