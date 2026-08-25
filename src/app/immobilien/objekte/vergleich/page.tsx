// Referenz ("Objekt-Bibliothek & Vergleich (UI)"): docs/tools/immobilien-rechner.md

import type { ReactNode } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Card, CardTitle } from "@/components/ui/Card";
import { AmpelBadge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatEuro, formatNumber, formatProzentOderNv } from "@/lib/format";
import { berechneObjekt } from "@/server/calc/engine";
import { ladeProfil } from "@/server/actions/profile";
import { ladeObjekteNachIds } from "@/server/data/property";
import { ladeReferenceDataSnapshot } from "@/server/data/reference-data";
import { toProfileInput, toPropertyInput } from "@/server/data/mappers";

export const metadata = { title: "Objektvergleich" };

// Kein ssr:false hier: Next.js verbietet das direkt in Server Components — der
// dynamische Import allein sorgt trotzdem für einen separaten, erst bei Bedarf
// geladenen Chunk statt Recharts fest ins Seiten-Bundle zu backen.
const VergleichChart = dynamic(() => import("@/components/charts/VergleichChart").then((m) => m.VergleichChart), {
  loading: () => <Skeleton className="h-[240px] w-full" />,
});
const VergleichVermoegensChart = dynamic(
  () => import("@/components/charts/VergleichVermoegensChart").then((m) => m.VergleichVermoegensChart),
  { loading: () => <Skeleton className="h-[260px] w-full" /> }
);

function normalizeIds(raw: string | string[] | undefined): string[] {
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}

export default async function VergleichPage({ searchParams }: PageProps<"/immobilien/objekte/vergleich">) {
  const params = await searchParams;
  const ids = normalizeIds(params.ids as string | string[] | undefined);

  const [rows, profilRow, referenceData] = await Promise.all([
    ladeObjekteNachIds(ids),
    ladeProfil(),
    ladeReferenceDataSnapshot(),
  ]);

  const profile = toProfileInput(profilRow);
  const objekte = rows.map((row) => ({
    id: row.id,
    name: row.asset.name,
    result: berechneObjekt(toPropertyInput(row), profile, referenceData),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Objektvergleich</h1>
        <p className="mt-1 text-slate-400">
          <Link href="/immobilien/objekte" className="text-blue-400 hover:underline">
            ← zurück zur Bibliothek
          </Link>
        </p>
      </div>

      {objekte.length < 2 ? (
        <Card>
          <p className="text-sm text-slate-400">Mindestens 2 Objekte in der Bibliothek auswählen, um sie zu vergleichen.</p>
        </Card>
      ) : (
        <>
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="sticky left-0 z-10 bg-slate-900 pb-3 pr-4 font-medium">Kennzahl</th>
                  {objekte.map((o) => (
                    <th key={o.id} className="pb-3 pr-4 font-medium text-slate-200">
                      <Link href={`/immobilien/objekte/${o.id}`} className="hover:underline">
                        {o.name}
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                <Row label="Bruttomietrendite" objekte={objekte} render={(r) => `${r.rendite.bruttomietrenditeProzent}%`} />
                <Row label="Nettomietrendite" objekte={objekte} render={(r) => `${r.rendite.nettomietrenditeProzent}%`} />
                <Row label="Kaufpreisfaktor" objekte={objekte} render={(r) => formatNumber(r.rendite.kaufpreisfaktor)} />
                <Row
                  label="Cashflow vor Steuer"
                  objekte={objekte}
                  render={(r) => `${formatEuro(r.rendite.monatlicherCashflowVorSteuer)}/Mon.`}
                />
                <Row
                  label="Cashflow nach Steuer"
                  objekte={objekte}
                  render={(r) => `${formatEuro(r.rendite.monatlicherCashflowNachSteuer)}/Mon.`}
                />
                <Row label="EK-Rendite" objekte={objekte} render={(r) => formatProzentOderNv(r.rendite.eigenkapitalrenditeProzent)} />
                <Row
                  label="Finanzierbarkeit"
                  objekte={objekte}
                  render={(r) => <AmpelBadge status={r.affordability.ampel} />}
                />
                <Row
                  label="Rechnet sich?"
                  objekte={objekte}
                  render={(r) => (r.dealBreaker.rechnetSich ? "Ja" : "Nein")}
                />
              </tbody>
            </table>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardTitle>Bruttomietrendite im Vergleich</CardTitle>
              <VergleichChart
                data={objekte.map((o) => ({
                  id: o.id,
                  name: o.name,
                  value: o.result.rendite.bruttomietrenditeProzent,
                  label: `${o.result.rendite.bruttomietrenditeProzent}%`,
                }))}
              />
            </Card>
            <Card>
              <CardTitle>Nettomietrendite im Vergleich</CardTitle>
              <VergleichChart
                data={objekte.map((o) => ({
                  id: o.id,
                  name: o.name,
                  value: o.result.rendite.nettomietrenditeProzent,
                  label: `${o.result.rendite.nettomietrenditeProzent}%`,
                }))}
              />
            </Card>
            <Card>
              <CardTitle>Cashflow nach Steuer im Vergleich</CardTitle>
              <VergleichChart
                data={objekte.map((o) => ({
                  id: o.id,
                  name: o.name,
                  value: o.result.rendite.monatlicherCashflowNachSteuer,
                  label: `${formatEuro(o.result.rendite.monatlicherCashflowNachSteuer)}/Mon.`,
                }))}
              />
            </Card>
            <Card>
              <CardTitle>Eigenkapitalrendite im Vergleich</CardTitle>
              <VergleichChart
                data={objekte.map((o) => ({
                  id: o.id,
                  name: o.name,
                  value: o.result.rendite.eigenkapitalrenditeProzent ?? 0,
                  label: formatProzentOderNv(o.result.rendite.eigenkapitalrenditeProzent),
                }))}
              />
            </Card>
            <Card>
              <CardTitle>Kaufpreisfaktor im Vergleich</CardTitle>
              <VergleichChart
                data={objekte.map((o) => ({
                  id: o.id,
                  name: o.name,
                  value: o.result.rendite.kaufpreisfaktor,
                  label: formatNumber(o.result.rendite.kaufpreisfaktor),
                }))}
              />
            </Card>
            <Card>
              <CardTitle>Kaufnebenkosten im Vergleich</CardTitle>
              <VergleichChart
                data={objekte.map((o) => ({
                  id: o.id,
                  name: o.name,
                  value: o.result.kaufnebenkosten.summeEuro,
                  label: formatEuro(o.result.kaufnebenkosten.summeEuro),
                }))}
              />
            </Card>
          </div>

          <Card>
            <CardTitle>Eigenkapitalaufbau im Vergleich (30 Jahre)</CardTitle>
            <VergleichVermoegensChart
              objekte={objekte.map((o) => ({
                id: o.id,
                name: o.name,
                eigenkapitalanteilProJahr: o.result.vermoegensverlauf.map((j) => j.eigenkapitalanteil),
              }))}
            />
          </Card>
        </>
      )}
    </div>
  );
}

function Row({
  label,
  objekte,
  render,
}: {
  label: string;
  objekte: { id: string; result: ReturnType<typeof berechneObjekt> }[];
  render: (result: ReturnType<typeof berechneObjekt>) => ReactNode;
}) {
  return (
    <tr>
      <td className="sticky left-0 z-10 bg-slate-900 py-2 pr-4 text-slate-400">{label}</td>
      {objekte.map((o) => (
        <td key={o.id} className="py-2 pr-4 text-slate-100">
          {render(o.result)}
        </td>
      ))}
    </tr>
  );
}
