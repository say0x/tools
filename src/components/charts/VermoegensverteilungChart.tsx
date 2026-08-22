"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatEuro } from "@/lib/format";

export function VermoegensverteilungChart({
  immobilienEigenkapital,
  bargeldUndDepots,
}: {
  immobilienEigenkapital: number;
  bargeldUndDepots: number;
}) {
  const data = [{ name: "Vermögen", immobilien: immobilienEigenkapital, bargeld: bargeldUndDepots }];

  return (
    <ResponsiveContainer width="100%" height={100}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
        <XAxis type="number" stroke="#64748b" fontSize={12} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
        <YAxis type="category" dataKey="name" hide />
        <Tooltip
          contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }}
          formatter={(value, name) => [formatEuro(Number(value) || 0), String(name)]}
        />
        <Legend />
        <Bar dataKey="immobilien" name="Immobilien (Eigenkapitalanteil)" stackId="a" fill="#3b82f6" radius={[4, 0, 0, 4]} />
        <Bar dataKey="bargeld" name="Bargeld & Depots" stackId="a" fill="#a855f7" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
