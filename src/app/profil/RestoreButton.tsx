"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { vorschauBackup, stelleBackupWieder, type BackupVorschau } from "@/server/actions/restore";

const BESTAETIGUNGSWORT = "DATEN ERSETZEN";

function formatZeitpunkt(iso: string | null) {
  if (!iso) return "unbekannt";
  try {
    return new Date(iso).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export function RestoreButton() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [rohesJson, setRohesJson] = useState<unknown>(null);
  const [vorschau, setVorschau] = useState<BackupVorschau | null>(null);
  const [bestaetigungstext, setBestaetigungstext] = useState("");
  const [fehler, setFehler] = useState<string | null>(null);
  const [erfolg, setErfolg] = useState(false);

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const datei = event.target.files?.[0];
    event.target.value = ""; // erlaubt erneute Auswahl derselben Datei nach einem Fehler
    if (!datei) return;

    setFehler(null);
    setVorschau(null);
    setBestaetigungstext("");

    const reader = new FileReader();
    reader.onload = () => {
      let json: unknown;
      try {
        json = JSON.parse(String(reader.result));
      } catch {
        setFehler("Keine gültige JSON-Datei.");
        return;
      }
      startTransition(async () => {
        const result = await vorschauBackup(json);
        if (!result.success) {
          setFehler(result.error);
          return;
        }
        setRohesJson(json);
        setVorschau(result.data);
      });
    };
    reader.onerror = () => setFehler("Datei konnte nicht gelesen werden.");
    reader.readAsText(datei);
  };

  const abbrechen = () => {
    setVorschau(null);
    setRohesJson(null);
    setBestaetigungstext("");
    setFehler(null);
  };

  const handleRestore = () => {
    setFehler(null);
    startTransition(async () => {
      const result = await stelleBackupWieder(rohesJson, bestaetigungstext);
      if (!result.success) {
        setFehler(result.error);
        return;
      }
      setErfolg(true);
      setVorschau(null);
      setRohesJson(null);
      // Voller Ersatz betrifft praktisch jede Seite, und bereits geladene
      // Formulare wie ProfileForm halten ihren Stand intern in react-hook-form
      // (ein einfaches router.refresh() würde die schon gemounteten Formulare
      // NICHT auf den neuen Stand zurücksetzen) — ein harter Reload ist hier
      // die einzige Variante, die garantiert überall den neuen Stand zeigt.
      setTimeout(() => window.location.reload(), 1500);
    });
  };

  if (erfolg) {
    return <p className="text-sm text-emerald-400">Backup wiederhergestellt. Seite wird neu geladen…</p>;
  }

  if (vorschau) {
    return (
      <div className="flex flex-col gap-4 rounded-md border border-red-900/60 bg-red-950/20 p-4">
        <div>
          <p className="text-sm font-medium text-red-300">Achtung: Dieser Vorgang ersetzt alle aktuellen Daten</p>
          <p className="mt-1 text-xs text-slate-400">Backup vom {formatZeitpunkt(vorschau.exportiertAm)}</p>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="pb-1 font-normal">Bereich</th>
              <th className="pb-1 font-normal">Aktuell</th>
              <th className="pb-1 font-normal">Nach Wiederherstellung</th>
            </tr>
          </thead>
          <tbody className="text-slate-200">
            <tr>
              <td className="py-0.5">Objekte</td>
              <td className="py-0.5 tabular-nums">{vorschau.aktuell.objekte}</td>
              <td className="py-0.5 tabular-nums">{vorschau.backup.objekte}</td>
            </tr>
            <tr>
              <td className="py-0.5">Sparpositionen</td>
              <td className="py-0.5 tabular-nums">{vorschau.aktuell.sparpositionen}</td>
              <td className="py-0.5 tabular-nums">{vorschau.backup.sparpositionen}</td>
            </tr>
            <tr>
              <td className="py-0.5">Szenarien</td>
              <td className="py-0.5 tabular-nums">{vorschau.aktuell.szenarien}</td>
              <td className="py-0.5 tabular-nums">{vorschau.backup.szenarien}</td>
            </tr>
            <tr>
              <td className="py-0.5">Profil</td>
              <td className="py-0.5">{vorschau.aktuell.profilVorhanden ? "vorhanden" : "leer"}</td>
              <td className="py-0.5">{vorschau.backup.profilVorhanden ? "vorhanden" : "leer"}</td>
            </tr>
          </tbody>
        </table>
        <p className="text-xs text-slate-400">
          Referenzdaten/Standardwerte (unter /immobilien/referenzdaten) sind nicht betroffen.
        </p>

        <div>
          <label htmlFor="restore-bestaetigung" className="mb-1 block text-xs text-slate-400">
            Zum Bestätigen exakt <span className="font-mono text-red-300">{BESTAETIGUNGSWORT}</span> eingeben:
          </label>
          <Input
            id="restore-bestaetigung"
            value={bestaetigungstext}
            onChange={(e) => setBestaetigungstext(e.target.value)}
            autoComplete="off"
          />
        </div>

        {fehler && <p className="text-xs text-red-400">{fehler}</p>}

        <div className="flex gap-2">
          <Button type="button" variant="danger" disabled={isPending || bestaetigungstext !== BESTAETIGUNGSWORT} onClick={handleRestore}>
            {isPending ? "Wird wiederhergestellt…" : "Jetzt unwiderruflich ersetzen"}
          </Button>
          <Button type="button" variant="ghost" disabled={isPending} onClick={abbrechen}>
            Abbrechen
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={handleFile} className="hidden" />
      <Button type="button" variant="secondary" disabled={isPending} onClick={() => fileInputRef.current?.click()}>
        {isPending ? "Prüfe…" : "Backup wiederherstellen (JSON)"}
      </Button>
      {fehler && <p className="whitespace-pre-line text-xs text-red-400">{fehler}</p>}
    </div>
  );
}
