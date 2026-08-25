"use client";

import { Bar, BarChart, CartesianGrid, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatEuro } from "@/lib/format";
import { nullBasierteDomain } from "@/lib/chart-domain";

export function MietVerwendungChart({
  zinsMonatlich,
  tilgungMonatlich,
  laufendeKostenMonatlich,
  cashflowVorSteuerMonatlich,
}: {
  zinsMonatlich: number;
  tilgungMonatlich: number;
  laufendeKostenMonatlich: number;
  cashflowVorSteuerMonatlich: number;
}) {
  const data = [
    {
      name: "Kaltmiete (Jahr 1)",
      zins: zinsMonatlich,
      tilgung: tilgungMonatlich,
      kosten: laufendeKostenMonatlich,
      cashflow: cashflowVorSteuerMonatlich,
    },
  ];

  return (
    <div
      role="img"
      aria-label="Balkendiagramm: Aufteilung der Kaltmiete in Jahr 1 auf Zins, Tilgung, laufende Kosten und verbleibenden Cashflow"
    >
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} layout="vertical" barSize={24} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#1e293b" horizontal={false} />
          <XAxis type="number" stroke="#64748b" fontSize={12} domain={nullBasierteDomain} tickFormatter={(v) => `${Math.round(v)}`} />
          <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={12} width={110} />
          <ReferenceLine x={0} stroke="#475569" />
          <Tooltip
            contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }}
            formatter={(value, name) => [formatEuro(Number(value) || 0), String(name)]}
          />
          <Legend />
          <Bar dataKey="zins" name="Zins" stackId="a" fill="#d95926" />
          <Bar dataKey="tilgung" name="Tilgung" stackId="a" fill="#199e70" />
          <Bar dataKey="kosten" name="Laufende Kosten" stackId="a" fill="#c98500" />
          <Bar dataKey="cashflow" name="Cashflow (Rest)" stackId="a" fill="#008300" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
