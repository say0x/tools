import { headers } from "next/headers";
import { Card, CardTitle } from "@/components/ui/Card";
import { getActiveUserId } from "@/server/session";
import { ladeApiTokensFuerUser } from "@/server/data/api-token";
import { kiAnalyseKonfiguriert } from "@/server/ki/mahlzeit-analyse";
import { erzeugeOpenApiSpezifikation } from "@/server/api/openapi";
import { curlBeispiele, haRestCommandYaml, haSecretsYaml, haSensorYaml } from "@/lib/integrationen/home-assistant-yaml";
import { KopierBlock } from "./KopierBlock";
import { TokenVerwaltung } from "./TokenVerwaltung";

export const dynamic = "force-dynamic";

export const metadata = { title: "Integrationen & API" };

const METHODEN_FARBE: Record<string, string> = {
  GET: "text-sky-300",
  POST: "text-emerald-300",
  PUT: "text-amber-300",
  DELETE: "text-red-300",
};

/** Basis-URL nur zur Anzeige in den Beispielen — so, wie der Browser die Seite gerade erreicht. */
async function basisUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = (h.get("x-forwarded-proto") ?? "http").split(",")[0].trim();
  return `${proto}://${host}`;
}

export default async function IntegrationenPage() {
  const userId = await getActiveUserId();
  const [tokens, basis] = await Promise.all([ladeApiTokensFuerUser(userId), basisUrl()]);
  const spec = erzeugeOpenApiSpezifikation();
  const endpunkte = Object.entries(spec.paths as Record<string, Record<string, { summary: string; security?: unknown[] }>>).flatMap(
    ([pfad, ops]) =>
      Object.entries(ops).map(([methode, op]) => ({
        methode: methode.toUpperCase(),
        pfad,
        summary: op.summary,
        oeffentlich: Array.isArray(op.security) && op.security.length === 0,
      }))
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Integrationen &amp; API</h1>
        <p className="mt-1 max-w-3xl text-slate-400">
          Über die REST-API lesen und schreiben Home Assistant, iOS-Kurzbefehle, Smart-Waagen oder eigene Skripte deine Fitness- und
          Finanzdaten. Jedes Token gehört zum gerade aktiven Nutzer und sieht nur dessen Daten.
        </p>
      </div>

      <Card>
        <CardTitle>API-Tokens</CardTitle>
        <TokenVerwaltung tokens={tokens} />
        <p className="mt-4 text-xs text-slate-400">
          Sicherheit: Tokens sind wie Passwörter. Die API ist für das Heimnetz/VPN gedacht — nicht ohne Reverse-Proxy mit HTTPS ins Internet
          freigeben. Ein Token mit „Nur lesen“ genügt für reine Anzeige-Sensoren.
        </p>
      </Card>

      <Card>
        <CardTitle>Home Assistant</CardTitle>
        <div className="flex flex-col gap-4">
          <p className="text-sm text-slate-400">
            Drei Schritte: Token in <code className="text-slate-300">secrets.yaml</code> ablegen, die REST-Sensoren in{" "}
            <code className="text-slate-300">configuration.yaml</code> einfügen, Home Assistant neu starten. Alle Sensoren kommen aus einem
            einzigen Request alle 5 Minuten. Automationen (Smart-Waage, Wasser-Knopf, Erinnerungen) stehen in{" "}
            <code className="text-slate-300">docs/integrations/home-assistant.md</code>.
          </p>
          <KopierBlock titel="1. secrets.yaml" inhalt={haSecretsYaml()} />
          <KopierBlock titel="2. Sensoren (configuration.yaml)" inhalt={haSensorYaml(basis)} />
          <KopierBlock titel="3. Optional: Werte zurückschreiben (configuration.yaml)" inhalt={haRestCommandYaml(basis)} />
          <p className="text-xs text-slate-400">
            Adresse: <code className="text-slate-300">{basis}</code> ist die Adresse, unter der dein Browser diese Seite gerade sieht. Läuft
            Home Assistant auf einem anderen Gerät, dort die LAN-Adresse des tools-Servers eintragen.
          </p>
        </div>
      </Card>

      <Card>
        <CardTitle>Schnellstart mit curl</CardTitle>
        <div className="flex flex-col gap-4">
          <p className="text-sm text-slate-400">
            Vorher <code className="text-slate-300">export TOOLS_TOKEN=tk_…</code> setzen.
            {!kiAnalyseKonfiguriert() && " Die Foto-Analyse antwortet mit 503, solange auf dem Server kein ANTHROPIC_API_KEY gesetzt ist."}
          </p>
          {curlBeispiele(basis).map((b) => (
            <KopierBlock key={b.titel} titel={b.titel} inhalt={b.befehl} />
          ))}
        </div>
      </Card>

      <Card>
        <CardTitle>Endpunkte</CardTitle>
        <p className="mb-3 text-sm text-slate-400">
          Vollständige Beschreibung inkl. Feldern, Grenzen und Fehlercodes als OpenAPI 3.1:{" "}
          <a href="/api/v1/openapi.json" className="text-blue-400 underline-offset-2 hover:underline">
            /api/v1/openapi.json
          </a>{" "}
          (z. B. in Swagger Editor oder Insomnia importieren).
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th scope="col" className="py-2 pr-3 font-medium">
                  Methode
                </th>
                <th scope="col" className="py-2 pr-3 font-medium">
                  Pfad
                </th>
                <th scope="col" className="py-2 font-medium">
                  Zweck
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {endpunkte.map((e) => (
                <tr key={`${e.methode} ${e.pfad}`}>
                  <td className={`py-2 pr-3 font-mono text-xs font-semibold ${METHODEN_FARBE[e.methode] ?? "text-slate-300"}`}>{e.methode}</td>
                  <td className="py-2 pr-3 font-mono text-xs text-slate-200">/api/v1{e.pfad}</td>
                  <td className="py-2 text-slate-300">
                    {e.summary}
                    {e.oeffentlich && <span className="ml-2 text-xs text-slate-400">(ohne Token)</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
