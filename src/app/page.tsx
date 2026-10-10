// Referenz (Dashboard-Kennzahlen, Notgroschen-Reichweite): docs/tools/weitere-rechner.md

import Link from "next/link";
import dynamicImport from "next/dynamic";
import { Card, CardTitle } from "@/components/ui/Card";
import { ToolKategorien } from "@/components/layout/ToolKategorien";
import { AmpelBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatEuro, formatNumber } from "@/lib/format";
import { AMPEL_LABELS } from "@/lib/labels";
import { FIELD_HILFE } from "@/lib/field-hilfe";
import { ladeDashboardKennzahlen } from "@/server/data/dashboard-kennzahlen";
import { ladeFitnessTag } from "@/server/data/fitness";
import { getActiveUserId } from "@/server/session";
import { heuteIso } from "@/server/calc/fitness/datum";
import { formatKcal } from "@/lib/fitness-labels";

export const dynamic = "force-dynamic";

// Kein ssr:false hier: Next.js verbietet das direkt in Server Components — der
// dynamische Import allein sorgt trotzdem für einen separaten, erst bei Bedarf
// geladenen Chunk statt Recharts fest ins Seiten-Bundle zu backen.
const VermoegensverteilungChart = dynamicImport(
  () => import("@/components/charts/VermoegensverteilungChart").then((m) => m.VermoegensverteilungChart),
  { loading: () => <Skeleton className="h-[100px] w-full" /> }
);

const AMPEL_FARBEN: Record<"GRUEN" | "GELB" | "ROT", string> = {
  GRUEN: "bg-emerald-500",
  GELB: "bg-amber-500",
  ROT: "bg-red-500",
};

export default async function Home() {
  const userId = await getActiveUserId();
  const [k, fitnessHeute] = await Promise.all([ladeDashboardKennzahlen(userId), ladeFitnessTag(userId, heuteIso())]);
  const {
    monatlicherImmobilienCashflow,
    ampelVerteilung,
    durchschnittlicheBruttorendite,
    sparvermoegen,
    notgroschenMonate,
    keinProfilHinterlegt,
    immobilienEigenkapitalReferenz,
    gesamtvermoegenReferenz,
    gesamtSchuldenRestschuld,
    gesamtvermoegenNetto,
    nochKeineDaten,
  } = k;
  const objekteRot = ampelVerteilung.ROT;

  const stats = [
    {
      label: "Immobilien im Besitz",
      value: `${k.objekteImBesitz}`,
      hint: `von ${k.objekteGesamt} Objekt(en) gesamt`,
      href: "/immobilien/objekte",
    },
    {
      label: "Bargeld & Depots",
      value: formatEuro(sparvermoegen),
      hint: `${k.sparpositionenImBesitz} Position(en)`,
      href: "/finanzuebersicht",
    },
    {
      label: "Immobilien-Cashflow",
      value: `${formatEuro(monatlicherImmobilienCashflow)}/Mon.`,
      hint: "netto, alle Objekte im Besitz",
      href: "/finanzuebersicht",
    },
    {
      label: "Szenarien",
      value: `${k.szenarienAnzahl}`,
      hint: "gespeicherte „Was wäre, wenn…“-Pläne",
      href: "/szenarien",
    },
  ];

  const fakten = [
    {
      label: "Notgroschen-Reichweite",
      value: notgroschenMonate === null ? "—" : `${formatNumber(notgroschenMonate, 1)} Monate`,
      hint:
        notgroschenMonate === null
          ? keinProfilHinterlegt
            ? "Fixkosten im Profil hinterlegen, um das zu berechnen"
            : "kein Tagesgeld erfasst"
          : "Tagesgeld ÷ Fixkosten/Monat aus dem Profil",
      warnung: notgroschenMonate !== null && notgroschenMonate < 3,
      netto: null as number | null,
    },
    {
      label: "Ø Bruttorendite",
      value: durchschnittlicheBruttorendite === null ? "—" : `${formatNumber(durchschnittlicheBruttorendite, 1)}%`,
      hint: "über alle Objekte im Besitz",
      netto: null as number | null,
    },
    {
      label: "Größte Sparposition",
      value: k.groessteSparposition ? formatEuro(k.groessteSparposition.betrag) : "—",
      hint: k.groessteSparposition?.name ?? "noch keine Position erfasst",
      netto: null as number | null,
    },
    {
      label: "Vermögen gesamt (Referenz)",
      value: formatEuro(gesamtvermoegenReferenz),
      hint: "Immobilien-EK-Anteil + Bargeld & Depots",
      hilfe: FIELD_HILFE.gesamtvermoegenReferenz,
      // Nur zeigen, wenn es einen Unterschied macht — bei keinen erfassten Krediten
      // wäre eine zweite, identische Zahl nur Redundanz statt zusätzlicher Information.
      netto: gesamtSchuldenRestschuld > 0 ? gesamtvermoegenNetto : null,
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Tool-Suite</h1>
        <p className="mt-1 text-slate-400">Interne Werkzeuge für Finanzen, Immobilien und Fitness.</p>
      </div>

      {nochKeineDaten && (
        <Card className="border-blue-900/50 bg-blue-950/10">
          <CardTitle>Los geht’s</CardTitle>
          <p className="text-sm text-slate-300">
            Noch keine Daten erfasst — sobald du dein erstes Objekt oder deine erste Sparposition anlegst, füllt sich
            dieses Dashboard mit deinen Kennzahlen.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/immobilien/objekte/neu">
              <Button size="sm">Immobilie anlegen</Button>
            </Link>
            <Link href="/finanzuebersicht">
              <Button variant="secondary" size="sm">
                Sparposition erfassen
              </Button>
            </Link>
            <Link href="/profil">
              <Button variant="ghost" size="sm">
                Profil ausfüllen
              </Button>
            </Link>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="transition-colors hover:border-slate-700">
              <div className="text-xs text-slate-400">{stat.label}</div>
              <div className="mt-1 text-xl font-semibold text-slate-100">{stat.value}</div>
              <div className="mt-1 text-xs text-slate-400">{stat.hint}</div>
            </Card>
          </Link>
        ))}
      </div>

      {objekteRot > 0 && (
        <Card className="flex items-center gap-3 border-red-900/50 bg-red-950/20">
          <AmpelBadge status="ROT" />
          <p className="text-sm text-slate-300">
            {objekteRot === 1 ? "Ein Objekt im Besitz steht" : `${objekteRot} Objekte im Besitz stehen`} aktuell im roten
            Ampelbereich.{" "}
            <Link href="/immobilien/objekte" className="text-blue-400 hover:underline">
              Jetzt prüfen
            </Link>
            .
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Vermögensverteilung</CardTitle>
          {gesamtvermoegenReferenz === 0 ? (
            <p className="text-sm text-slate-400">Noch keine Vermögenswerte erfasst.</p>
          ) : (
            <>
              <VermoegensverteilungChart immobilienEigenkapital={immobilienEigenkapitalReferenz} bargeldUndDepots={sparvermoegen} />
              <p className="mt-2 text-xs text-slate-400">
                Immobilien-Eigenkapitalanteil ist eine reine Referenzgröße (Marktwert abzüglich Restschuld) — anders als in der
                Finanzübersicht zählt er hier zur Verteilung, weil es um die Frage geht, wo dein Vermögen aktuell steckt, nicht um
                verfügbares Geld.
              </p>
            </>
          )}
        </Card>

        <Card>
          <CardTitle>Objekte nach Ampel</CardTitle>
          {k.objekteImBesitz === 0 ? (
            <p className="text-sm text-slate-400">Keine Objekte im Besitz.</p>
          ) : (
            <>
              <div className="flex h-6 overflow-hidden rounded-md">
                {(["GRUEN", "GELB", "ROT"] as const).map(
                  (status) =>
                    ampelVerteilung[status] > 0 && (
                      <div
                        key={status}
                        className={AMPEL_FARBEN[status]}
                        style={{ width: `${(ampelVerteilung[status] / k.objekteImBesitz) * 100}%` }}
                        title={`${AMPEL_LABELS[status]}: ${ampelVerteilung[status]}`}
                      />
                    )
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-sm">
                {(["GRUEN", "GELB", "ROT"] as const).map((status) => (
                  <div key={status} className="flex items-center gap-1.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${AMPEL_FARBEN[status]}`} />
                    <span className="text-slate-400">
                      {AMPEL_LABELS[status]}: <span className="text-slate-200">{ampelVerteilung[status]}</span>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {fakten.map((fakt) => (
          <Card key={fakt.label} className={fakt.warnung ? "border-amber-900/50 bg-amber-950/10" : undefined}>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              {fakt.label}
              {fakt.hilfe && <InfoTooltip text={fakt.hilfe} />}
            </div>
            <div className={`mt-1 text-lg font-semibold ${fakt.warnung ? "text-amber-400" : "text-slate-100"}`}>{fakt.value}</div>
            <div className="mt-1 text-xs text-slate-400">{fakt.hint}</div>
            {fakt.netto !== null && (
              <div className="mt-1 text-xs text-slate-400">
                Netto (abzgl. Restschulden): <span className="text-slate-300">{formatEuro(fakt.netto)}</span>
              </div>
            )}
          </Card>
        ))}
      </div>

      {fitnessHeute.bilanz && (
        <Link href="/fitness">
          <Card className="transition-colors hover:border-slate-700">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <CardTitle className="mb-0">Fitness heute</CardTitle>
              <span className={`text-sm ${fitnessHeute.bilanz.ueberBudget ? "text-amber-400" : "text-slate-400"}`}>
                {fitnessHeute.bilanz.ueberBudget
                  ? `${formatKcal(-fitnessHeute.bilanz.verbleibend)} über Budget`
                  : `${formatKcal(fitnessHeute.bilanz.verbleibend)} übrig`}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div>
                <div className="text-xs text-slate-400">Gegessen / Budget</div>
                <div className="tabular-nums text-slate-100">
                  {formatKcal(fitnessHeute.bilanz.zugefuehrt.kcal)} / {formatKcal(fitnessHeute.bilanz.budget)}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Protein</div>
                <div className="tabular-nums text-slate-100">
                  {Math.round(fitnessHeute.bilanz.makros.protein.ist)} / {Math.round(fitnessHeute.bilanz.makros.protein.ziel)} g
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Training</div>
                <div className="tabular-nums text-slate-100">
                  {fitnessHeute.trainings.length > 0 ? `${fitnessHeute.trainings.reduce((s, t) => s + t.dauerMin, 0)} min` : "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Gewicht</div>
                <div className="tabular-nums text-slate-100">{fitnessHeute.gewichtKg != null ? `${formatNumber(fitnessHeute.gewichtKg, 1)} kg` : "—"}</div>
              </div>
            </div>
          </Card>
        </Link>
      )}

      <section aria-labelledby="werkzeuge">
        <h2 id="werkzeuge" className="mb-3 text-sm font-medium text-slate-400">
          Werkzeuge
        </h2>
        <ToolKategorien variante="startseite" />
      </section>
    </div>
  );
}
