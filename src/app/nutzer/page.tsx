import { ladeNutzer, wechsleNutzerFormAction } from "@/server/actions/user";
import { getActiveUserId } from "@/server/session";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { NutzerForm } from "./NutzerForm";

// Liest live aus der DB — nicht build-zeitig statisch prerendern.
export const dynamic = "force-dynamic";

export const metadata = { title: "Nutzer" };

function formatDatum(datum: Date) {
  return datum.toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" });
}

export default async function NutzerPage() {
  const [nutzer, aktiverUserId] = await Promise.all([ladeNutzer(), getActiveUserId()]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Nutzer</h1>
        <p className="mt-1 text-slate-400">
          Lokale Test-User zum Ausprobieren der Datenisolation — <strong>kein echtes Login</strong>. Jeder Test-User
          hat seine eigenen Objekte, Sparpositionen, Szenarien und sein eigenes Profil; Referenzdaten bleiben für alle
          gleich. Wer gerade aktiv ist, steuert einfach ein unsigniertes Cookie im Browser.
        </p>
      </div>

      <Card>
        <CardTitle>Vorhandene Test-User</CardTitle>
        <ul className="flex flex-col gap-2">
          {nutzer.map((n) => {
            const istAktiv = n.id === aktiverUserId;
            return (
              <li
                key={n.id}
                className="flex items-center justify-between gap-3 rounded-md border border-slate-800 bg-slate-950/40 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-100">{n.name}</span>
                  {istAktiv && (
                    <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-400">
                      Aktiv
                    </span>
                  )}
                  <span className="text-xs text-slate-400">seit {formatDatum(n.createdAt)}</span>
                </div>
                {!istAktiv && (
                  <form action={wechsleNutzerFormAction.bind(null, n.id)}>
                    <Button type="submit" variant="secondary" size="sm">
                      Aktivieren
                    </Button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      </Card>

      <Card>
        <CardTitle>Neuen Test-User anlegen</CardTitle>
        <NutzerForm />
      </Card>
    </div>
  );
}
