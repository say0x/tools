"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { erstelleApiToken, widerrufeApiToken } from "@/server/actions/api-token";
import type { ApiTokenAnzeige } from "@/server/data/api-token";
import { KopierBlock } from "./KopierBlock";

const zeitpunkt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Berlin" }) : "noch nie";

export function TokenVerwaltung({ tokens }: { tokens: ApiTokenAnzeige[] }) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [schreibzugriff, setSchreibzugriff] = useState(true);
  const [fehler, setFehler] = useState<string | null>(null);
  const [neu, setNeu] = useState<{ name: string; klartext: string } | null>(null);

  const erstellen = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFehler(null);
    startTransition(async () => {
      const result = await erstelleApiToken({ name, schreibzugriff });
      if (!result.success) {
        setFehler(result.error);
        return;
      }
      setNeu({ name: name.trim(), klartext: result.data.klartext });
      setName("");
    });
  };

  const widerrufen = (token: ApiTokenAnzeige) => {
    if (!window.confirm(`Token „${token.name}“ widerrufen? Geräte, die es nutzen, verlieren sofort den Zugriff.`)) return;
    startTransition(async () => {
      const result = await widerrufeApiToken(token.id);
      if (!result.success) window.alert(result.error);
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {neu && (
        <div role="status" className="flex flex-col gap-3 rounded-md border border-emerald-500/40 bg-emerald-500/10 p-4">
          <p className="text-sm text-emerald-200">
            Token „{neu.name}“ erstellt. <strong>Jetzt kopieren</strong> — es wird nur dieses eine Mal angezeigt und ist danach nicht
            mehr abrufbar (gespeichert wird nur ein Hash).
          </p>
          <KopierBlock titel="Neues Token" inhalt={neu.klartext} />
          <div>
            <Button type="button" variant="secondary" size="sm" onClick={() => setNeu(null)}>
              Ich habe es gespeichert
            </Button>
          </div>
        </div>
      )}

      <form onSubmit={erstellen} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="token-name" className="mb-1.5 block text-sm text-slate-300">
            Name des Tokens
          </label>
          <Input
            id="token-name"
            value={name}
            maxLength={100}
            onChange={(e) => setName(e.target.value)}
            placeholder="z. B. Home Assistant, iPhone-Kurzbefehl, Waage"
            disabled={isPending}
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2 pb-2 text-sm text-slate-300">
          <Switch bare checked={schreibzugriff} onChange={(e) => setSchreibzugriff(e.target.checked)} disabled={isPending} />
          Darf schreiben
        </label>
        <Button type="submit" disabled={isPending || name.trim() === ""}>
          Token erstellen
        </Button>
      </form>
      {fehler && (
        <p role="alert" className="text-sm text-red-400">
          {fehler}
        </p>
      )}

      {tokens.length === 0 ? (
        <p className="text-sm text-slate-400">Noch keine Tokens. Für Home Assistant reicht meist ein Token mit Schreibzugriff.</p>
      ) : (
        <ul className="flex flex-col gap-2" aria-label="Vorhandene Tokens">
          {tokens.map((t) => (
            <li key={t.id} className="flex flex-col gap-2 rounded-md border border-slate-800 bg-slate-950/40 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="flex flex-wrap items-center gap-2 text-sm text-slate-100">
                  {t.name}
                  <code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-slate-300">{t.praefix}…</code>
                  <span
                    className={
                      t.schreibzugriff
                        ? "rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-300"
                        : "rounded-full border border-slate-600 bg-slate-800 px-2 py-0.5 text-xs text-slate-300"
                    }
                  >
                    {t.schreibzugriff ? "Lesen + Schreiben" : "Nur lesen"}
                  </span>
                </span>
                <span className="text-xs text-slate-400">
                  erstellt {zeitpunkt(t.createdAt)} · zuletzt genutzt {zeitpunkt(t.zuletztGenutztAm)}
                </span>
              </div>
              <Button type="button" variant="ghost" size="sm" disabled={isPending} onClick={() => widerrufen(t)} aria-label={`Token ${t.name} widerrufen`}>
                Widerrufen
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
