"use client";

import { Area, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PortfolioJahr } from "@/server/calc/types";
import { formatEuro } from "@/lib/format";
import { tickInterval } from "@/lib/chart-ticks";

export function SzenarioVergleichChart({
  ohneSzenario,
  mitSzenario,
  immobilienwertVerlauf,
}: {
  ohneSzenario: PortfolioJahr[];
  mitSzenario: PortfolioJahr[];
  /** Optional: EK-Anteil-Referenzverlauf der im Szenario enthaltenen Immobilien (separate Linie, nicht Teil von gesamtNominal). */
  immobilienwertVerlauf?: number[];
}) {
  const data = ohneSzenario.map((jahr, i) => ({
    kalenderjahr: jahr.kalenderjahr,
    ohneSzenario: jahr.gesamtNominal,
    mitSzenario: mitSzenario[i]?.gesamtNominal ?? jahr.gesamtNominal,
    immobilienwert: immobilienwertVerlauf?.[i],
  }));

  return (
    <div role="img" aria-label="Liniendiagramm: Vermögensverlauf mit und ohne Szenario im Vergleich über die Jahre">
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="szenario-mit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a855f7" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1e293b" />
          <XAxis dataKey="kalenderjahr" stroke="#64748b" fontSize={12} interval={tickInterval(data.length)} />
          <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
          <Tooltip
            contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }}
            labelFormatter={(kalenderjahr) => `Jahr ${kalenderjahr}`}
            formatter={(value, name) => [formatEuro(Number(value) || 0), String(name)]}
          />
          <Legend />
          <Area type="monotone" dataKey="mitSzenario" name="Mit Szenario" stroke="#a855f7" fill="url(#szenario-mit)" />
          <Line type="monotone" dataKey="ohneSzenario" name="Ohne Szenario" stroke="#3b82f6" strokeDasharray="4 4" strokeWidth={2} dot={false} />
          {immobilienwertVerlauf && (
            <Line
              type="monotone"
              dataKey="immobilienwert"
              name="Immobilienwert (Referenz, im Szenario)"
              stroke="#f97316"
              strokeDasharray="2 3"
              strokeWidth={2}
              dot={false}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
