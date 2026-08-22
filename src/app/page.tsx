import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/Card";
import { AmpelBadge } from "@/components/ui/Badge";
import { formatEuro } from "@/lib/format";
import { BESITZSTATUS_ZAEHLT_IM_VERMOEGEN } from "@/lib/asset";
import { berechneObjekt } from "@/server/calc/engine";
import { ladeProfil } from "@/server/actions/profile";
import { ladeSparpositionen } from "@/server/actions/finanzuebersicht";
import { ladeSzenarien } from "@/server/actions/szenario";
import { ladeObjekte } from "@/server/data/property";
import { ladeReferenceDataSnapshot } from "@/server/data/reference-data";
import { toProfileInput, toPropertyInput } from "@/server/data/mappers";

export const dynamic = "force-dynamic";

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
];

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
  const objekteRot = objekteImBesitz.filter((r) => r.affordability.ampel === "ROT").length;

  const sparpositionenImBesitz = [...sparpositionenRows.wertpapiere, ...sparpositionenRows.tagesgeld].filter(
    (p) => p.asset.besitzstatus === BESITZSTATUS_ZAEHLT_IM_VERMOEGEN
  );
  const sparvermoegen = sparpositionenImBesitz.reduce((summe, p) => summe + p.betrag, 0);

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
