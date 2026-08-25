"use client";

import { Bar, BarChart, CartesianGrid, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatEuro } from "@/lib/format";
import { nullBasierteDomain } from "@/lib/chart-domain";

export function CashflowAufschluesselungChart({
  jahr,
  mieteMonatlich,
  zinsMonatlich,
  tilgungMonatlich,
  laufendeKostenMonatlich,
  steuerMonatlich,
  cashflowVorSteuerMonatlich,
  cashflowNachSteuerMonatlich,
}: {
  jahr: number;
  mieteMonatlich: number;
  zinsMonatlich: number;
  tilgungMonatlich: number;
  laufendeKostenMonatlich: number;
  steuerMonatlich: number;
  cashflowVorSteuerMonatlich: number;
  cashflowNachSteuerMonatlich: number;
}) {
  const data = [
    {
      name: "Miete",
      miete: mieteMonatlich,
    },
    {
      name: "Vor Steuer",
      zins: zinsMonatlich,
      tilgung: tilgungMonatlich,
      kosten: laufendeKostenMonatlich,
      steuer: 0,
      cashflow: cashflowVorSteuerMonatlich,
    },
    {
      name: "Nach Steuer",
      zins: zinsMonatlich,
      tilgung: tilgungMonatlich,
      kosten: laufendeKostenMonatlich,
      steuer: steuerMonatlich,
      cashflow: cashflowNachSteuerMonatlich,
    },
  ];

  return (
    <div
      role="img"
      aria-label={`Balkendiagramm: Kaltmiete in Jahr ${jahr} im Vergleich zum Cashflow vor und nach Steuer, aufgeteilt auf Zins, Tilgung, laufende Kosten und Steuer`}
    >
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical" barSize={24} stackOffset="sign" margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#1e293b" horizontal={false} />
          <XAxis type="number" stroke="#64748b" fontSize={12} domain={nullBasierteDomain} tickFormatter={(v) => `${Math.round(v)}`} />
          <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={12} width={90} />
          <ReferenceLine x={0} stroke="#475569" />
          <Tooltip
            contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }}
            formatter={(value, name) => [formatEuro(Number(value) || 0), String(name)]}
          />
          <Legend />
          <Bar dataKey="miete" name="Miete (Einnahmen)" stackId="a" fill="#3987e5" radius={[4, 4, 4, 4]} />
          <Bar dataKey="zins" name="Zins" stackId="a" fill="#d95926" />
          <Bar dataKey="tilgung" name="Tilgung" stackId="a" fill="#199e70" />
          <Bar dataKey="kosten" name="Laufende Kosten" stackId="a" fill="#c98500" />
          <Bar dataKey="steuer" name="Steuer" stackId="a" fill="#d55181" />
          <Bar dataKey="cashflow" name="Cashflow" stackId="a" fill="#008300" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
