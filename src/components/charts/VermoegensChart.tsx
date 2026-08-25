"use client";

import { Area, CartesianGrid, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Meilensteine, VermoegensverlaufJahr } from "@/server/calc/types";
import { formatEuro } from "@/lib/format";
import { tickInterval } from "@/lib/chart-ticks";

export function VermoegensChart({ data, meilensteine }: { data: VermoegensverlaufJahr[]; meilensteine?: Meilensteine }) {
  const maxJahr = data[data.length - 1]?.jahr ?? 0;

  return (
    <div
      role="img"
      aria-label="Diagramm: Immobilienwert, Restschuld und Eigenkapitalanteil (nominal und real) über die Jahre"
    >
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="wert" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="ek" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="jahr" stroke="#64748b" fontSize={12} interval={tickInterval(data.length)} />
          <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
          <Tooltip
            contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }}
            labelFormatter={(jahr) => `Jahr ${jahr}`}
            formatter={(value, name) => [formatEuro(Number(value) || 0), String(name)]}
          />
          <Legend />
          <Area type="monotone" dataKey="immobilienwert" name="Immobilienwert" stroke="#3b82f6" fill="url(#wert)" />
          <Area type="monotone" dataKey="restschuld" name="Restschuld" stroke="#f97316" fillOpacity={0} />
          <Area type="monotone" dataKey="eigenkapitalanteil" name="Eigenkapitalanteil" stroke="#10b981" fill="url(#ek)" />
          <Line
            type="monotone"
            dataKey="eigenkapitalanteilReal"
            name="Eigenkapitalanteil (real, inflationsbereinigt)"
            stroke="#10b981"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            dot={false}
          />
          {meilensteine && meilensteine.zinsbindungEndeJahr <= maxJahr && (
            <ReferenceLine
              x={meilensteine.zinsbindungEndeJahr}
              stroke="#a855f7"
              strokeDasharray="4 4"
              label={{ value: "Zinsbindung endet", position: "insideTopLeft", fill: "#a855f7", fontSize: 11 }}
            />
          )}
          {meilensteine?.volltilgungJahr != null && meilensteine.volltilgungJahr <= maxJahr && (
            <ReferenceLine
              x={meilensteine.volltilgungJahr}
              stroke="#10b981"
              strokeDasharray="4 4"
              label={{ value: "Kredit abbezahlt", position: "insideTopRight", fill: "#10b981", fontSize: 11 }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
