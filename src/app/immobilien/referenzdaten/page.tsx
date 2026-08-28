import { Card, CardTitle } from "@/components/ui/Card";
import { prisma } from "@/server/db";
import { GrunderwerbsteuerTable } from "./GrunderwerbsteuerTable";
import { MietpreisTable } from "./MietpreisTable";
import { GewerkKostenTable } from "./GewerkKostenTable";
import { NutzungsdauerTable } from "./NutzungsdauerTable";
import { KaufnebenkostenDefaultsCard } from "./KaufnebenkostenDefaultsCard";
import { KaufpreisfaktorTable } from "./KaufpreisfaktorTable";
import { StandardwerteCard } from "./StandardwerteCard";
import { ladeKaufnebenkostenDefaultsRow, ladeStandardwerte } from "@/server/data/reference-data";

export const dynamic = "force-dynamic";

export const metadata = { title: "Referenzdaten" };

export default async function ReferenzdatenPage() {
  const [grunderwerbsteuerRows, mietpreiseRows, gewerkKostenRows, nutzungsdauer, kaufnebenkostenDefaults, kaufpreisfaktorenRows, standardwerte] =
    await Promise.all([
      prisma.referenceGrunderwerbsteuer.findMany({ orderBy: { bundesland: "asc" } }),
      prisma.referenceMietpreis.findMany(),
      prisma.referenceGewerkKosten.findMany(),
      prisma.referenceNutzungsdauer.findMany(),
      ladeKaufnebenkostenDefaultsRow(),
      prisma.referenceKaufpreisfaktor.findMany(),
      ladeStandardwerte(),
    ]);

  // Geld-/Prozentfelder kommen als Decimal aus der DB — hier auf number konvertiert, bevor die
  // Zeilen an die "use client"-Tabellenkomponenten weitergereicht werden (siehe mappers.ts oben
  // für die ausführliche Begründung, warum Prisma-Decimal-Instanzen dort nicht direkt landen dürfen).
  const grunderwerbsteuer = grunderwerbsteuerRows.map((r) => ({ ...r, satzProzent: r.satzProzent.toNumber() }));
  const mietpreise = mietpreiseRows.map((r) => ({ ...r, mietpreisProM2: r.mietpreisProM2.toNumber() }));
  const gewerkKosten = gewerkKostenRows.map((r) => ({
    ...r,
    kostenProM2Min: r.kostenProM2Min.toNumber(),
    kostenProM2Max: r.kostenProM2Max.toNumber(),
  }));
  const kaufpreisfaktoren = kaufpreisfaktorenRows.map((r) => ({ ...r, kaufpreisfaktorReferenz: r.kaufpreisfaktorReferenz.toNumber() }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Referenzdaten</h1>
        <p className="mt-1 text-slate-400">
          Startwerte für Automatik &amp; Vergleiche — frei editierbar, keine Live-Anbindung. Werte vor wichtigen
          Entscheidungen gegen aktuelle Quellen prüfen.
        </p>
      </div>

      <Card>
        <CardTitle>Grunderwerbsteuer nach Bundesland</CardTitle>
        <GrunderwerbsteuerTable initialRows={grunderwerbsteuer} />
      </Card>

      <Card>
        <CardTitle>Notar- &amp; Grundbuch-Standardsätze</CardTitle>
        <KaufnebenkostenDefaultsCard
          initialNotarProzent={kaufnebenkostenDefaults?.notarProzent.toNumber() ?? 1.0}
          initialGrundbuchProzent={kaufnebenkostenDefaults?.grundbuchProzent.toNumber() ?? 0.5}
        />
      </Card>

      <Card>
        <CardTitle>Standardwerte für neue Objekte</CardTitle>
        <StandardwerteCard initialWerte={standardwerte} />
      </Card>

      <Card>
        <CardTitle>Vergleichs-Mietpreis (€/m²) nach Bundesland &amp; Lagetyp</CardTitle>
        <MietpreisTable initialRows={mietpreise} />
      </Card>

      <Card>
        <CardTitle>Kaufpreisfaktor-Vergleichswert nach Objekttyp &amp; Lagetyp</CardTitle>
        <KaufpreisfaktorTable initialRows={kaufpreisfaktoren} />
      </Card>

      <Card>
        <CardTitle>Sanierungskosten je Gewerk (€/m² Wohnfläche)</CardTitle>
        <GewerkKostenTable initialRows={gewerkKosten} />
      </Card>

      <Card>
        <CardTitle>Übliche Nutzungsdauer je Gewerk (Jahre)</CardTitle>
        <p className="mb-4 text-xs text-slate-500">
          Ist ein Gewerk laut Baujahr älter als hier hinterlegt, wird das unabhängig vom optischen Zustand als
          Verhandlungsargument ausgewiesen.
        </p>
        <NutzungsdauerTable initialRows={nutzungsdauer} />
      </Card>
    </div>
  );
}
