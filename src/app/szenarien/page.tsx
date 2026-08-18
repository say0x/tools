import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ladeSzenarien } from "@/server/actions/szenario";
import { SZENARIO_AENDERUNG_TYP_LABELS } from "@/lib/labels";
import { DeleteSzenarioButton } from "./[id]/DeleteSzenarioButton";

export const dynamic = "force-dynamic";

export default async function SzenarienPage() {
  const szenarien = await ladeSzenarien();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Szenarien</h1>
          <p className="mt-1 text-slate-400">
            „Was wäre, wenn…“ — Szenarien verändern nie deine echten Daten, sie rechnen nur zusätzlich damit.
          </p>
        </div>
        <Link href="/szenarien/neu">
          <Button>+ Neues Szenario</Button>
        </Link>
      </div>

      {szenarien.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-400">
            Noch kein Szenario angelegt. <Link href="/szenarien/neu" className="text-blue-400 hover:underline">Jetzt das erste erstellen</Link> — z. B. „Was wäre, wenn ich 2028 eine Wohnung kaufe?“.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {szenarien.map((s) => (
            <Card key={s.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Link href={`/szenarien/${s.id}`} className="font-medium text-slate-100 hover:underline">
                  {s.name}
                </Link>
                <div className="mt-1 text-sm text-slate-500">
                  Ab {s.startjahr} · {s.aenderungen.length === 0 ? "keine Änderungen" : `${s.aenderungen.length} Änderung(en)`}
                  {s.aenderungen.length > 0 && (
                    <> — {[...new Set(s.aenderungen.map((a) => SZENARIO_AENDERUNG_TYP_LABELS[a.typ]))].join(", ")}</>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/szenarien/${s.id}`}>
                  <Button variant="secondary" size="sm">
                    Öffnen
                  </Button>
                </Link>
                <DeleteSzenarioButton id={s.id} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
