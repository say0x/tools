"use client";

import { useMemo, useState } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { BETRACHTUNGSZEITRAUM_PRESETS } from "@/server/calc/constants";
import type { CalculationResult } from "@/server/calc/types";
import { formatEuro } from "@/lib/format";
import { VermoegensChart } from "./VermoegensChart";
import { CashflowChart } from "./CashflowChart";
import { MonthlyCashflowChart } from "./MonthlyCashflowChart";
import { MietVerwendungChart } from "./MietVerwendungChart";
import { CashflowAufschluesselungChart } from "./CashflowAufschluesselungChart";

const MAX_JAHRE = 50;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function ObjektChartsPanel({ result }: { result: CalculationResult }) {
  const [betrachtungszeitraum, setBetrachtungszeitraum] = useState(30);
  const [ausgewaehltesJahr, setAusgewaehltesJahr] = useState(1);

  const sichtbareDaten = useMemo(
    () => result.vermoegensverlauf.slice(0, betrachtungszeitraum),
    [result.vermoegensverlauf, betrachtungszeitraum]
  );

  const jahrDaten = result.vermoegensverlauf.find((j) => j.jahr === ausgewaehltesJahr) ?? result.vermoegensverlauf[0];
  const tilgungsplanJahr = result.tilgungsplan.find((j) => j.jahr === ausgewaehltesJahr) ?? result.tilgungsplan[0];

  const setZeitraum = (jahre: number) => {
    const geklemmt = Math.max(1, Math.min(MAX_JAHRE, jahre));
    setBetrachtungszeitraum(geklemmt);
    if (ausgewaehltesJahr > geklemmt) setAusgewaehltesJahr(geklemmt);
  };

  const zinsMonatlich = round2((tilgungsplanJahr?.zinszahlung ?? 0) / 12);
  const tilgungMonatlich = round2((tilgungsplanJahr?.tilgungszahlung ?? 0) / 12);
  const laufendeKostenMonatlich = round2((jahrDaten?.kostenJahr ?? 0) / 12);
  const steuerMonatlich = round2((jahrDaten?.steuerJahr ?? 0) / 12);
  const cashflowVorSteuerMonatlich = round2((jahrDaten?.cashflowVorSteuerJahr ?? 0) / 12);
  const cashflowNachSteuerMonatlich = round2((jahrDaten?.cashflowNachSteuerJahr ?? 0) / 12);

  const mieteMonatlich = round2(zinsMonatlich + tilgungMonatlich + laufendeKostenMonatlich + cashflowVorSteuerMonatlich);

  const jahrPresets = BETRACHTUNGSZEITRAUM_PRESETS.filter((jahre) => jahre <= betrachtungszeitraum);

  const jahrAuswahl = (
    <div className="flex flex-wrap items-center gap-1.5">
      {jahrPresets.map((jahre) => (
        <Button
          key={jahre}
          type="button"
          size="sm"
          variant={ausgewaehltesJahr === jahre ? "primary" : "secondary"}
          onClick={() => setAusgewaehltesJahr(jahre)}
        >
          {jahre}J
        </Button>
      ))}
    </div>
  );

  return (
    <>
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="mb-0">Wohin geht die Miete? (Jahr {ausgewaehltesJahr})</CardTitle>
          {jahrAuswahl}
        </div>
        <MietVerwendungChart
          jahr={ausgewaehltesJahr}
          zinsMonatlich={zinsMonatlich}
          tilgungMonatlich={tilgungMonatlich}
          laufendeKostenMonatlich={laufendeKostenMonatlich}
          cashflowVorSteuerMonatlich={cashflowVorSteuerMonatlich}
        />
        <p className="mt-2 text-xs text-slate-500">
          Effektive Kaltmiete Jahr {ausgewaehltesJahr}: {formatEuro(mieteMonatlich)}/Monat, aufgeteilt auf Zins, Tilgung,
          laufende Kosten und den verbleibenden Cashflow. Miete und laufende Kosten sind bereits mit den angenommenen
          Steigerungsraten auf dieses Jahr fortgeschrieben.
        </p>
      </Card>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="mb-0">Cashflow vor &amp; nach Steuer im Vergleich (Jahr {ausgewaehltesJahr})</CardTitle>
          {jahrAuswahl}
        </div>
        <CashflowAufschluesselungChart
          jahr={ausgewaehltesJahr}
          zinsMonatlich={zinsMonatlich}
          tilgungMonatlich={tilgungMonatlich}
          laufendeKostenMonatlich={laufendeKostenMonatlich}
          steuerMonatlich={steuerMonatlich}
          cashflowVorSteuerMonatlich={cashflowVorSteuerMonatlich}
          cashflowNachSteuerMonatlich={cashflowNachSteuerMonatlich}
        />
        <p className="mt-2 text-xs text-slate-500">
          Gleiche Bausteine wie oben, zusätzlich mit Steuer-Segment (rot = Steuerlast, wächst der Cashflow-Balken statt dessen,
          war es eine Steuererstattung).
        </p>
      </Card>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="mb-0">Vermögensverlauf</CardTitle>
          <div className="flex flex-wrap items-center gap-1.5">
            {BETRACHTUNGSZEITRAUM_PRESETS.map((jahre) => (
              <Button
                key={jahre}
                type="button"
                size="sm"
                variant={betrachtungszeitraum === jahre ? "primary" : "secondary"}
                onClick={() => setZeitraum(jahre)}
              >
                {jahre}J
              </Button>
            ))}
            <input
              type="number"
              min={1}
              max={MAX_JAHRE}
              value={betrachtungszeitraum}
              onChange={(e) => setZeitraum(Number(e.target.value) || 1)}
              className="w-16 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              aria-label="Betrachtungszeitraum in Jahren (max. 50)"
            />
          </div>
        </div>
        <VermoegensChart data={sichtbareDaten} meilensteine={result.meilensteine} />
        <p className="mt-2 text-xs text-slate-500">
          Betrachtungszeitraum: {betrachtungszeitraum} {betrachtungszeitraum === 1 ? "Jahr" : "Jahre"}
          {result.meilensteine.volltilgungJahr != null &&
            ` · Kredit abbezahlt in Jahr ${result.meilensteine.volltilgungJahr}`}
          {result.meilensteine.zinsbindungEndeJahr < betrachtungszeitraum &&
            (result.meilensteine.volltilgungJahr == null || result.meilensteine.volltilgungJahr > result.meilensteine.zinsbindungEndeJahr) &&
            ` · Anschlussfinanzierung ab Jahr ${result.meilensteine.zinsbindungEndeJahr + 1}: angenommen ${result.meilensteine.anschlusszinssatzProzent}% Zins`}
        </p>
      </Card>

      <Card>
        <CardTitle>Kumulierter Cashflow — vor &amp; nach Steuer</CardTitle>
        <CashflowChart data={sichtbareDaten} />
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <CardTitle className="mb-0">Monatlicher Cashflow in einem Jahr</CardTitle>
          <Select
            className="w-auto"
            value={ausgewaehltesJahr}
            onChange={(e) => setAusgewaehltesJahr(Number(e.target.value))}
          >
            {Array.from({ length: betrachtungszeitraum }, (_, i) => i + 1).map((jahr) => (
              <option key={jahr} value={jahr}>
                Jahr {jahr}
              </option>
            ))}
          </Select>
        </div>
        {jahrDaten && (
          <MonthlyCashflowChart
            cashflowVorSteuerJahr={jahrDaten.cashflowVorSteuerJahr}
            cashflowNachSteuerJahr={jahrDaten.cashflowNachSteuerJahr}
          />
        )}
        <p className="mt-2 text-xs text-slate-500">
          Näherung: Jahreswert gleichmäßig auf 12 Monate verteilt (keine unterjährige Saisonalität im Modell).
        </p>
      </Card>
    </>
  );
}
