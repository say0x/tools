import Link from "next/link";
import dynamicImport from "next/dynamic";
import { Card, CardTitle } from "@/components/ui/Card";
import { AmpelBadge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatEuro, formatNumber } from "@/lib/format";
import { BESITZSTATUS_ZAEHLT_IM_VERMOEGEN } from "@/lib/asset";
import { berechneObjekt } from "@/server/calc/engine";
import { ladeProfil } from "@/server/actions/profile";
import { ladeSparpositionen } from "@/server/actions/finanzuebersicht";
import { ladeSzenarien } from "@/server/actions/szenario";
import { ladeObjekte } from "@/server/data/property";
import { ladeReferenceDataSnapshot } from "@/server/data/reference-data";
import { toProfileInput, toPropertyInput } from "@/server/data/mappers";
import { berechneImmobilienPositionen } from "@/server/data/vermoegen";

export const dynamic = "force-dynamic";

// Kein ssr:false hier: Next.js verbietet das direkt in Server Components — der
// dynamische Import allein sorgt trotzdem für einen separaten, erst bei Bedarf
// geladenen Chunk statt Recharts fest ins Seiten-Bundle zu backen.
const VermoegensverteilungChart = dynamicImport(
  () => import("@/components/charts/VermoegensverteilungChart").then((m) => m.VermoegensverteilungChart),
  { loading: () => <Skeleton className="h-[100px] w-full" /> }
);

const tools = [
  {
    href: "/immobilien/objekte",
    title: "Immobilien-Rechner",
    description: "Objekte erfassen, Kennzahlen berechnen, vergleichen — rechnet sich der Kauf?",
  },
  {
    href: "/finanzuebersicht",
    title: "Finanzübersicht",
    description: "Wertpapiere, Tagesgeld & Immobilien-Cashflow zusammen betrachten — wie viel Geld hast du in wie vielen Jahren wirklich zur Verfügung?",
  },
  {
    href: "/szenarien",
    title: "Szenarien",
    description: "„Was wäre, wenn…“ — Käufe, Verkäufe, Sparraten & Anschaffungen durchspielen, ohne deine echten Daten zu verändern.",
  },
  {
    href: "/sparziel",
    title: "Sparziel-Rechner",
    description: "Freistehender Zinseszins-Rechner: Kapitalverlauf einer Sparrate über Zeit, und wann ein Zielbetrag erreicht ist.",
  },
];

const AMPEL_FARBEN: Record<"GRUEN" | "GELB" | "ROT", string> = {
  GRUEN: "bg-emerald-500",
  GELB: "bg-amber-500",
  ROT: "bg-red-500",
};
const AMPEL_LABEL: Record<"GRUEN" | "GELB" | "ROT", string> = { GRUEN: "Grün", GELB: "Gelb", ROT: "Rot" };

export default async function Home() {
  const [propertyRows, profilRow, referenceData, sparpositionenRows, szenarien] = await Promise.all([
    ladeObjekte(),
    ladeProfil(),
    ladeReferenceDataSnapshot(),
    ladeSparpositionen(),
    ladeSzenarien(),
  ]);

  const profile = toProfileInput(profilRow);

  const objekteImBesitz = propertyRows
    .filter((row) => row.asset.besitzstatus === BESITZSTATUS_ZAEHLT_IM_VERMOEGEN)
    .map((row) => berechneObjekt(toPropertyInput(row), profile, referenceData));

  const monatlicherImmobilienCashflow = objekteImBesitz.reduce(
    (summe, r) => summe + r.rendite.monatlicherCashflowNachSteuer,
    0
  );
  const ampelVerteilung: Record<"GRUEN" | "GELB" | "ROT", number> = { GRUEN: 0, GELB: 0, ROT: 0 };
  for (const o of objekteImBesitz) ampelVerteilung[o.affordability.ampel]++;
  const objekteRot = ampelVerteilung.ROT;

  const durchschnittlicheBruttorendite =
    objekteImBesitz.length === 0
      ? null
      : objekteImBesitz.reduce((summe, r) => summe + r.rendite.bruttomietrenditeProzent, 0) / objekteImBesitz.length;

  const sparpositionenImBesitz = [...sparpositionenRows.wertpapiere, ...sparpositionenRows.tagesgeld].filter(
    (p) => p.asset.besitzstatus === BESITZSTATUS_ZAEHLT_IM_VERMOEGEN
  );
  const sparvermoegen = sparpositionenImBesitz.reduce((summe, p) => summe + p.betrag, 0);
  const groessteSparposition = sparpositionenImBesitz.reduce(
    (groesste, p) => (groesste === null || p.betrag > groesste.betrag ? p : groesste),
    null as (typeof sparpositionenImBesitz)[number] | null
  );

  const immobilienpositionen = berechneImmobilienPositionen(propertyRows, profile, referenceData);
  const immobilienEigenkapitalReferenz = immobilienpositionen
    .filter((p) => p.besitzstatus === BESITZSTATUS_ZAEHLT_IM_VERMOEGEN)
    .reduce((summe, p) => summe + p.eigenkapitalanteilHeuteReferenz, 0);
  const gesamtvermoegenReferenz = immobilienEigenkapitalReferenz + sparvermoegen;

  const stats = [
    {
      label: "Immobilien im Besitz",
      value: `${objekteImBesitz.length}`,
      hint: `von ${propertyRows.length} Objekt(en) gesamt`,
      href: "/immobilien/objekte",
    },
    {
      label: "Bargeld & Depots",
      value: formatEuro(sparvermoegen),
      hint: `${sparpositionenImBesitz.length} Position(en)`,
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
      value: `${szenarien.length}`,
      hint: "gespeicherte „Was wäre, wenn…“-Pläne",
      href: "/szenarien",
    },
  ];

  const fakten = [
    {
      label: "Ø Bruttorendite",
      value: durchschnittlicheBruttorendite === null ? "—" : `${formatNumber(durchschnittlicheBruttorendite, 1)}%`,
      hint: "über alle Objekte im Besitz",
    },
    {
      label: "Größte Sparposition",
      value: groessteSparposition ? formatEuro(groessteSparposition.betrag) : "—",
      hint: groessteSparposition?.asset.name ?? "noch keine Position erfasst",
    },
    {
      label: "Vermögen gesamt (Referenz)",
      value: formatEuro(gesamtvermoegenReferenz),
      hint: "Immobilien-EK-Anteil + Bargeld & Depots",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Tool-Suite</h1>
        <p className="mt-1 text-slate-400">Interne Finanz- und Investment-Werkzeuge.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="transition-colors hover:border-slate-700">
              <div className="text-xs text-slate-500">{stat.label}</div>
              <div className="mt-1 text-xl font-semibold text-slate-100">{stat.value}</div>
              <div className="mt-1 text-xs text-slate-500">{stat.hint}</div>
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
              <p className="mt-2 text-xs text-slate-500">
                Immobilien-Eigenkapitalanteil ist eine reine Referenzgröße (Marktwert abzüglich Restschuld) — anders als in der
                Finanzübersicht zählt er hier zur Verteilung, weil es um die Frage geht, wo dein Vermögen aktuell steckt, nicht um
                verfügbares Geld.
              </p>
            </>
          )}
        </Card>

        <Card>
          <CardTitle>Objekte nach Ampel</CardTitle>
          {objekteImBesitz.length === 0 ? (
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
                        style={{ width: `${(ampelVerteilung[status] / objekteImBesitz.length) * 100}%` }}
                        title={`${AMPEL_LABEL[status]}: ${ampelVerteilung[status]}`}
                      />
                    )
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-sm">
                {(["GRUEN", "GELB", "ROT"] as const).map((status) => (
                  <div key={status} className="flex items-center gap-1.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${AMPEL_FARBEN[status]}`} />
                    <span className="text-slate-400">
                      {AMPEL_LABEL[status]}: <span className="text-slate-200">{ampelVerteilung[status]}</span>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {fakten.map((fakt) => (
          <Card key={fakt.label}>
            <div className="text-xs text-slate-500">{fakt.label}</div>
            <div className="mt-1 text-lg font-semibold text-slate-100">{fakt.value}</div>
            <div className="mt-1 text-xs text-slate-500">{fakt.hint}</div>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-slate-400">Werkzeuge</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {tools.map((tool) => (
            <Link key={tool.title} href={tool.href}>
              <Card className="transition-colors hover:border-slate-700">
                <CardTitle className="mb-1">{tool.title}</CardTitle>
                <p className="text-sm text-slate-400">{tool.description}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
