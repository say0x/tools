import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AmpelBadge } from "@/components/ui/Badge";
import { formatEuro } from "@/lib/format";
import { berechneObjekt } from "@/server/calc/engine";
import { ladeProfil } from "@/server/actions/profile";
import { ladeObjekte } from "@/server/data/property";
import { ladeReferenceDataSnapshot } from "@/server/data/reference-data";
import { toProfileInput, toPropertyInput } from "@/server/data/mappers";
import { DeleteObjectButton } from "./[id]/DeleteObjectButton";
import { DuplicateObjectButton } from "./DuplicateObjectButton";

export const dynamic = "force-dynamic";

export const metadata = { title: "Immobilien" };

export default async function ObjektBibliothekPage() {
  const [rows, profilRow, referenceData] = await Promise.all([
    ladeObjekte(),
    ladeProfil(),
    ladeReferenceDataSnapshot(),
  ]);

  const profile = toProfileInput(profilRow);

  const objekte = rows.map((row) => ({
    id: row.id,
    name: row.asset.name,
    kaufpreis: row.kaufpreis,
    result: berechneObjekt(toPropertyInput(row), profile, referenceData),
  }));

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
        <form action="/immobilien/objekte/vergleich" method="get" className="flex flex-col gap-4">
          <p className="text-xs text-slate-500">
            Checkbox anhaken, um mehrere Objekte auszuwählen und unten mit &quot;Ausgewählte vergleichen&quot; gegenüberzustellen.
          </p>
          <div className="flex flex-col gap-3">
            {objekte.map((o) => (
              <Card key={o.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    name="ids"
                    value={o.id}
                    aria-label={`${o.name} zum Vergleich auswählen`}
                    className="mt-1.5 h-4 w-4 accent-blue-600"
                  />
                  <div>
                    <Link href={`/immobilien/objekte/${o.id}`} className="font-medium text-slate-100 hover:underline">
                      {o.name}
                    </Link>
                    <div className="mt-1 text-sm text-slate-500">{formatEuro(o.kaufpreis)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:flex sm:items-center">
                  <Stat label="Bruttorendite" value={`${o.result.rendite.bruttomietrenditeProzent}%`} />
                  <Stat label="Cashflow n. St." value={`${formatEuro(o.result.rendite.monatlicherCashflowNachSteuer)}/Mon.`} />
                  <AmpelBadge status={o.result.affordability.ampel} />
                </div>

                <div className="flex gap-2">
                  <Link href={`/immobilien/objekte/${o.id}`}>
                    <Button variant="secondary" size="sm">
                      Öffnen
                    </Button>
                  </Link>
                  <DuplicateObjectButton id={o.id} />
                  <DeleteObjectButton id={o.id} />
                </div>
              </Card>
            ))}
          </div>

          <Button type="submit" variant="secondary" className="self-start">
            Ausgewählte vergleichen
          </Button>
        </form>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-medium text-slate-100">{value}</div>
    </div>
  );
}
