"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { analysiereMahlzeitFoto } from "@/server/actions/fitness-ki";
import { erstelleMahlzeiten } from "@/server/actions/fitness";
import { skalierePosition, type KiPosition } from "@/server/calc/fitness/ki-plausibilitaet";
import type { KiKonfidenz, Mahlzeit } from "@/server/calc/fitness/types";
import { KI_KONFIDENZ_LABELS, MAHLZEIT_LABELS, formatKcal } from "@/lib/fitness-labels";
import { zahlOderNull } from "../_components/zahl";

/** Längste Kante laut Claude-Vision-Empfehlung — größer bringt keine Genauigkeit, nur Upload-Zeit. */
const MAX_KANTE_PX = 1568;

async function verkleinereBild(datei: File): Promise<string> {
  const bitmap = await createImageBitmap(datei);
  const faktor = Math.min(1, MAX_KANTE_PX / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * faktor);
  canvas.height = Math.round(bitmap.height * faktor);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.85);
}

interface Ergebnis {
  beschreibung: string;
  konfidenz: KiKonfidenz;
  hinweise: string;
  inkonsistentePositionen: string[];
  modell: string;
  erkannt: boolean;
}

export function FotoAnalyse({ datum, mahlzeit, verfuegbar }: { datum: string; mahlzeit: Mahlzeit; verfuegbar: boolean }) {
  const dateiRef = useRef<HTMLInputElement>(null);
  const [bild, setBild] = useState<string | null>(null);
  const [hinweis, setHinweis] = useState("");
  const [ergebnis, setErgebnis] = useState<Ergebnis | null>(null);
  const [positionen, setPositionen] = useState<KiPosition[]>([]);
  const [fehler, setFehler] = useState<string | null>(null);
  const [erfolg, setErfolg] = useState<string | null>(null);
  const [analysiert, startAnalyse] = useTransition();
  const [speichert, startSpeichern] = useTransition();

  if (!verfuegbar) {
    return (
      <div className="flex flex-col gap-2 text-sm text-slate-300">
        <p>Die KI-Fotoanalyse ist auf diesem Server noch nicht eingerichtet.</p>
        <p className="text-slate-400">
          Zum Aktivieren in der Server-Umgebung <code className="rounded bg-slate-800 px-1">ANTHROPIC_API_KEY</code> setzen (z. B. in der{" "}
          <code className="rounded bg-slate-800 px-1">.env</code> neben <code className="rounded bg-slate-800 px-1">docker-compose.yml</code>) und
          den Container neu starten. Fotos werden dann zur Analyse an die Claude API gesendet und von tools nicht gespeichert — Details in
          docs/tools/fitness.md.
        </p>
      </div>
    );
  }

  const waehleDatei = async (datei: File | undefined) => {
    setFehler(null);
    setErfolg(null);
    setErgebnis(null);
    setPositionen([]);
    if (!datei) return;
    try {
      setBild(await verkleinereBild(datei));
    } catch {
      setBild(null);
      setFehler("Das Bild konnte nicht gelesen werden (Format nicht unterstützt?). Bitte JPEG oder PNG verwenden.");
    }
  };

  const analysieren = () => {
    if (!bild) return;
    setFehler(null);
    setErfolg(null);
    startAnalyse(async () => {
      const r = await analysiereMahlzeitFoto({ dataUrl: bild, hinweis });
      if (!r.success) {
        setFehler(r.error);
        return;
      }
      const { positionen: pos, ...rest } = r.data;
      setErgebnis(rest);
      setPositionen(pos);
    });
  };

  const aendere = (index: number, feld: keyof KiPosition, wert: string) =>
    setPositionen((liste) =>
      liste.map((p, i) => {
        if (i !== index) return p;
        if (feld === "bezeichnung") return { ...p, bezeichnung: wert };
        const zahl = zahlOderNull(wert) ?? 0;
        return feld === "mengeG" ? skalierePosition(p, zahl) : { ...p, [feld]: zahl };
      })
    );

  const uebernehmen = () =>
    startSpeichern(async () => {
      setFehler(null);
      const r = await erstelleMahlzeiten(
        positionen.map((p) => ({
          datum,
          mahlzeit,
          bezeichnung: p.bezeichnung,
          mengeG: p.mengeG,
          kcal: p.kcal,
          proteinG: p.proteinG,
          kohlenhydrateG: p.kohlenhydrateG,
          fettG: p.fettG,
          quelle: "FOTO_KI",
          kiKonfidenz: ergebnis?.konfidenz ?? null,
        }))
      );
      if (!r.success) {
        setFehler(r.error);
        return;
      }
      setErfolg(`${r.data.anzahl} Position(en) zu ${MAHLZEIT_LABELS[mahlzeit]} eingetragen.`);
      setErgebnis(null);
      setPositionen([]);
      setBild(null);
      setHinweis("");
      if (dateiRef.current) dateiRef.current.value = "";
    });

  const summe = positionen.reduce((s, p) => s + p.kcal, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-3">
          <Field label="Foto der Mahlzeit" hint="Auf dem Handy öffnet sich direkt die Kamera. Teller ganz im Bild, Besteck als Größenreferenz hilft.">
            <input
              ref={dateiRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => waehleDatei(e.target.files?.[0])}
              className="block w-full text-sm text-slate-300 file:mr-3 file:rounded-md file:border file:border-slate-700 file:bg-slate-800 file:px-3 file:py-1.5 file:text-sm file:text-slate-100 hover:file:bg-slate-700"
            />
          </Field>
          <Field label="Zusatzinfo (optional)" hint="Was man nicht sieht: Zubereitung, Soße, Portionsgröße, Marke …">
            <Input value={hinweis} onChange={(e) => setHinweis(e.target.value)} placeholder="z. B. mit Sahnesoße, halbe Portion gegessen" maxLength={500} />
          </Field>
          <div>
            <Button type="button" onClick={analysieren} disabled={!bild || analysiert}>
              {analysiert ? "Analysiere … (ca. 5–20 s)" : "Foto analysieren"}
            </Button>
          </div>
        </div>
        {bild && (
          // eslint-disable-next-line @next/next/no-img-element -- lokale Data-URL-Vorschau, keine optimierbare Remote-Ressource
          <img src={bild} alt="Vorschau des gewählten Mahlzeitenfotos" className="max-h-64 w-full rounded-md border border-slate-800 object-contain" />
        )}
      </div>

      {fehler && (
        <p role="alert" className="text-sm text-red-400">
          {fehler}
        </p>
      )}
      {erfolg && (
        <p role="status" className="text-sm text-emerald-400">
          {erfolg}
        </p>
      )}

      {ergebnis && !ergebnis.erkannt && <p className="text-sm text-amber-400">Auf dem Foto wurde kein Essen erkannt. {ergebnis.beschreibung}</p>}

      {ergebnis?.erkannt && (
        <div className="flex flex-col gap-3 rounded-md border border-slate-800 p-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
            <span className="text-slate-200">{ergebnis.beschreibung}</span>
            <span className="rounded border border-slate-700 px-2 py-0.5 text-xs text-slate-300">KI-Schätzung · {KI_KONFIDENZ_LABELS[ergebnis.konfidenz]}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400">
                  <th className="pb-1 pr-2 font-medium">Position</th>
                  <th className="pb-1 pr-2 font-medium">Menge (g)</th>
                  <th className="pb-1 pr-2 font-medium">kcal</th>
                  <th className="pb-1 pr-2 font-medium">Protein</th>
                  <th className="pb-1 pr-2 font-medium">KH</th>
                  <th className="pb-1 pr-2 font-medium">Fett</th>
                  <th className="pb-1" />
                </tr>
              </thead>
              <tbody>
                {positionen.map((p, i) => (
                  <tr key={i}>
                    <td className="py-1 pr-2">
                      <Input aria-label={`Position ${i + 1} Bezeichnung`} value={p.bezeichnung} onChange={(e) => aendere(i, "bezeichnung", e.target.value)} />
                    </td>
                    {(["mengeG", "kcal", "proteinG", "kohlenhydrateG", "fettG"] as const).map((feld) => (
                      <td key={feld} className="w-24 py-1 pr-2">
                        <Input
                          aria-label={`Position ${i + 1} ${feld}`}
                          inputMode="decimal"
                          value={String(p[feld]).replace(".", ",")}
                          onChange={(e) => aendere(i, feld, e.target.value)}
                        />
                      </td>
                    ))}
                    <td className="py-1">
                      <button
                        type="button"
                        aria-label={`${p.bezeichnung} entfernen`}
                        onClick={() => setPositionen((l) => l.filter((_, j) => j !== i))}
                        className="rounded-md px-2 py-1 text-xs text-slate-400 hover:bg-red-950/40 hover:text-red-300"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400">Menge ändern skaliert die Nährwerte automatisch mit. Gesamt: {formatKcal(summe)}.</p>
          {ergebnis.hinweise && <p className="text-xs text-slate-400">Annahmen der KI: {ergebnis.hinweise}</p>}
          {ergebnis.inkonsistentePositionen.length > 0 && (
            <p className="text-xs text-amber-400">
              Bitte prüfen: bei {ergebnis.inkonsistentePositionen.join(", ")} passen Kalorien und Makros nicht gut zusammen.
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={uebernehmen} disabled={speichert || positionen.length === 0}>
              {speichert ? "Speichert…" : `Alle in ${MAHLZEIT_LABELS[mahlzeit]} übernehmen`}
            </Button>
            <span className="text-xs text-slate-400">Modell: {ergebnis.modell}</span>
          </div>
        </div>
      )}
    </div>
  );
}
