import { Card, CardTitle } from "@/components/ui/Card";
import { prisma } from "@/server/db";
import { GrunderwerbsteuerTable } from "./GrunderwerbsteuerTable";
import { MietpreisTable } from "./MietpreisTable";
import { GewerkKostenTable } from "./GewerkKostenTable";

export const dynamic = "force-dynamic";

export default async function ReferenzdatenPage() {
  const [grunderwerbsteuer, mietpreise, gewerkKosten] = await Promise.all([
    prisma.referenceGrunderwerbsteuer.findMany({ orderBy: { bundesland: "asc" } }),
    prisma.referenceMietpreis.findMany(),
    prisma.referenceGewerkKosten.findMany(),
  ]);

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
        <CardTitle>Vergleichs-Mietpreis (€/m²) nach Bundesland &amp; Lagetyp</CardTitle>
        <MietpreisTable initialRows={mietpreise} />
      </Card>

      <Card>
        <CardTitle>Sanierungskosten je Gewerk (€/m² Wohnfläche)</CardTitle>
        <GewerkKostenTable initialRows={gewerkKosten} />
      </Card>
    </div>
  );
}
