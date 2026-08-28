import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { berechneObjekt } from "@/server/calc/engine";
import { ladeProfil } from "@/server/actions/profile";
import { ladeObjekte } from "@/server/data/property";
import { ladeReferenceDataSnapshot } from "@/server/data/reference-data";
import { toProfileInput, toPropertyInput } from "@/server/data/mappers";
import { ObjekteListClient } from "./ObjekteListClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "Immobilien" };

export default async function ObjektBibliothekPage() {
  const [rows, profilRow, referenceData] = await Promise.all([
    ladeObjekte(),
    ladeProfil(),
    ladeReferenceDataSnapshot(),
  ]);

  const profile = toProfileInput(profilRow);

  const objekte = rows.map((row) => {
    const result = berechneObjekt(toPropertyInput(row), profile, referenceData);
    return {
      id: row.id,
      name: row.asset.name,
      kaufpreis: row.kaufpreis.toNumber(),
      besitzstatus: row.asset.besitzstatus,
      bruttomietrenditeProzent: result.rendite.bruttomietrenditeProzent,
      monatlicherCashflowNachSteuer: result.rendite.monatlicherCashflowNachSteuer,
      ampel: result.affordability.ampel,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Immobilien</h1>
          <p className="mt-1 text-slate-400">{objekte.length} Objekt(e) gespeichert.</p>
        </div>
        <Link href="/immobilien/objekte/neu">
          <Button>+ Neues Objekt</Button>
        </Link>
      </div>

      {objekte.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-400">
            Noch keine Objekte erfasst. <Link href="/immobilien/objekte/neu" className="text-blue-400 hover:underline">Jetzt das erste anlegen</Link>.
          </p>
        </Card>
      ) : (
        <ObjekteListClient objekte={objekte} />
      )}
    </div>
  );
}
