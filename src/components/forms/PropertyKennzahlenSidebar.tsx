import dynamic from "next/dynamic";
import { Card, CardTitle } from "@/components/ui/Card";
import { AmpelBadge } from "@/components/ui/Badge";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { Skeleton } from "@/components/ui/Skeleton";
import { Stat } from "@/components/forms/Stat";
import { formatEuro, formatNumber, formatProzentOderNv } from "@/lib/format";
import { formatiereVerhandlungsargument } from "@/lib/verhandlungstexte";
import { formatiereAnnahmenWarnung } from "@/lib/annahmen-warnungstexte";
import { FIELD_HILFE } from "@/lib/field-hilfe";
import type { CalculationResult } from "@/server/calc/types";

// Dynamisch importiert: bündelt die Recharts-Diagramme, die erst unterhalb des Formulars
// sichtbar sind (showCharts) — das Formular selbst soll ohne Recharts im Bundle interaktiv sein.
const ObjektChartsPanel = dynamic(() => import("@/components/charts/ObjektChartsPanel").then((m) => m.ObjektChartsPanel), {
  ssr: false,
  loading: () => (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <Skeleton className="h-64 w-full" />
        </Card>
      ))}
    </>
  ),
});

/**
 * Reine Anzeige der aus `result` abgeleiteten Kennzahlen im PropertyForm —
 * unabhängig vom react-hook-form-Kontext extrahiert (braucht kein
 * register/control, nur das bereits berechnete Ergebnis), damit die
 * eigentliche Formularlogik in PropertyForm.tsx nicht in der Anzeigelogik
 * untergeht.
 *
 * Referenz (Kennzahlen-Sidebar): docs/tools/immobilien-rechner.md
 */
export function PropertyKennzahlenSidebar({
  result,
  showCharts,
}: {
  result: CalculationResult | null;
  showCharts: boolean;
}) {
  if (!result) {
    return (
      <Card>
        <p className="text-sm text-slate-500">Wohnfläche &gt; 0 eingeben, um Kennzahlen live zu sehen.</p>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardTitle>Kennzahlen</CardTitle>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Stat label="Bruttomietrendite" value={`${result.rendite.bruttomietrenditeProzent}%`} />
          <Stat label="Nettomietrendite" value={`${result.rendite.nettomietrenditeProzent}%`} />
          <Stat label="Kaufpreisfaktor" value={formatNumber(result.rendite.kaufpreisfaktor)} />
          <Stat
            label="EK-Rendite"
            value={formatProzentOderNv(result.rendite.eigenkapitalrenditeProzent)}
            subValue={result.rendite.eigenkapitalrenditeProzent === null ? "kein EK eingesetzt" : undefined}
            hilfe={FIELD_HILFE.ekRenditeKennzahl}
          />
          <Stat label="Cashflow vor Steuer" value={formatEuro(result.rendite.monatlicherCashflowVorSteuer) + "/Mon."} />
          <Stat label="Cashflow nach Steuer" value={formatEuro(result.rendite.monatlicherCashflowNachSteuer) + "/Mon."} />
        </div>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <CardTitle className="mb-0">
            Rechnet sich das? <InfoTooltip text={FIELD_HILFE.rechnetSichKennzahl} />
          </CardTitle>
          <AmpelBadge status={result.dealBreaker.ampel} />
        </div>
        <p className={`text-sm ${result.dealBreaker.rechnetSich ? "text-emerald-400" : "text-amber-400"}`}>
          {result.dealBreaker.meldung}
        </p>
        {result.affordability.begruendung.map((b, i) => (
          <p key={i} className="mt-2 text-xs text-slate-500">
            {b}
          </p>
        ))}
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <CardTitle className="mb-0">Kapitaleffizienz</CardTitle>
          <AmpelBadge status={result.kapitaleffizienz.ampel} />
        </div>
        {result.kapitaleffizienz.begruendung.map((b, i) => (
          <p key={i} className="text-xs text-slate-500">
            {b}
          </p>
        ))}
      </Card>

      {result.annahmenWarnungen.length > 0 && (
        <Card className="border-amber-900/50 bg-amber-950/10">
          <CardTitle>Diese Annahmen schönen das Ergebnis</CardTitle>
          <p className="mb-3 text-xs text-slate-500">
            Technisch gültige, aber unrealistisch günstige Eingaben — kein Fehler, aber ein Grund, das Ergebnis mit
            Vorsicht zu lesen.
          </p>
          <div className="flex flex-col gap-3">
            {result.annahmenWarnungen.map((warnung, i) => {
              const { titel, text } = formatiereAnnahmenWarnung(warnung);
              return (
                <div key={i} className="rounded-md border border-amber-900/40 bg-amber-950/20 p-3">
                  <p className="text-sm font-medium text-amber-300">{titel}</p>
                  <p className="mt-1 text-sm text-slate-300">{text}</p>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {result.verhandlungsargumente.length > 0 && (
        <Card>
          <CardTitle>Verhandlungs-Argumente</CardTitle>
          <p className="mb-3 text-xs text-slate-500">
            Automatisch aus deinen Angaben abgeleitet — Fakten für ein Gespräch mit Verkäufer oder Makler.
          </p>
          <div className="flex flex-col gap-3">
            {result.verhandlungsargumente.map((arg, i) => {
              const { titel, text } = formatiereVerhandlungsargument(arg);
              return (
                <div key={i} className="rounded-md border border-amber-900/40 bg-amber-950/20 p-3">
                  <p className="text-sm font-medium text-amber-300">{titel}</p>
                  <p className="mt-1 text-sm text-slate-300">{text}</p>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {showCharts && <ObjektChartsPanel result={result} />}
    </>
  );
}
