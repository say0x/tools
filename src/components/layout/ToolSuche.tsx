"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { standardTreffer, sucheTools, type SuchTreffer } from "@/lib/tool-suche";

const ZULETZT_SCHLUESSEL = "tools.zuletzt-verwendet";
const ZULETZT_MAX = 5;

function ladeZuletzt(): string[] {
  try {
    const wert: unknown = JSON.parse(localStorage.getItem(ZULETZT_SCHLUESSEL) ?? "[]");
    return Array.isArray(wert) ? wert.filter((h): h is string => typeof h === "string") : [];
  } catch {
    return [];
  }
}

/** Merkt sich das besuchte Tool für „Zuletzt verwendet“ — nur in diesem Browser, rein als Komfort. */
export function merkeBesuch(href: string) {
  try {
    localStorage.setItem(ZULETZT_SCHLUESSEL, JSON.stringify([href, ...ladeZuletzt().filter((h) => h !== href)].slice(0, ZULETZT_MAX)));
  } catch {
    // Privater Modus / gesperrter Speicher: dann eben ohne Verlauf.
  }
}

/**
 * Befehlspalette (Strg+K, ⌘K oder „/“): Suche über alle Tools, ihre Bereiche
 * und Schnellzugriffe. Wird nur gerendert, solange sie offen ist; der native
 * <dialog> übernimmt Fokusfalle, Escape und die Rückgabe des Fokus.
 * Bedienmuster: WAI-ARIA Combobox mit Listbox. Referenz: ADR-0012.
 */
export function ToolSuche({ onSchliessen }: { onSchliessen: () => void }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const listeId = useId();
  const [anfrage, setAnfrage] = useState("");
  const [aktiv, setAktiv] = useState(0);
  const [zuletzt] = useState(ladeZuletzt);

  const treffer: SuchTreffer[] = anfrage.trim() ? sucheTools(anfrage) : standardTreffer(zuletzt);
  const aktiverIndex = Math.min(aktiv, Math.max(0, treffer.length - 1));
  const optionId = (i: number) => `${listeId}-${i}`;

  useEffect(() => {
    document.getElementById(`${listeId}-${aktiverIndex}`)?.scrollIntoView({ block: "nearest" });
  }, [listeId, aktiverIndex]);

  const oeffne = (t: SuchTreffer | undefined) => {
    if (!t) return;
    dialogRef.current?.close();
    router.push(t.href);
  };

  const tastatur = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setAktiv((aktiverIndex + 1) % Math.max(1, treffer.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setAktiv((aktiverIndex - 1 + treffer.length) % Math.max(1, treffer.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      oeffne(treffer[aktiverIndex]);
    }
  };

  return (
    <dialog
      ref={(el) => {
        dialogRef.current = el;
        if (el && !el.open) el.showModal();
      }}
      aria-label="Tools durchsuchen"
      onClose={onSchliessen}
      onClick={(e) => {
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
      className="mx-auto mt-[12vh] w-[min(36rem,calc(100vw-2rem))] max-w-none rounded-xl border border-slate-700 bg-slate-900 p-0 text-slate-100 shadow-2xl shadow-black/50 backdrop:bg-slate-950/70 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-center gap-2 border-b border-slate-800 px-4">
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="11" cy="11" r="7" />
          <path strokeLinecap="round" d="M20 20l-3.5-3.5" />
        </svg>
        <input
          autoFocus
          type="text"
          role="combobox"
          aria-label="Tool, Bereich oder Aktion suchen"
          aria-expanded={treffer.length > 0}
          aria-controls={listeId}
          aria-autocomplete="list"
          aria-activedescendant={treffer.length > 0 ? optionId(aktiverIndex) : undefined}
          placeholder="Tool, Bereich oder Aktion suchen …"
          value={anfrage}
          onChange={(e) => {
            setAnfrage(e.target.value);
            setAktiv(0);
          }}
          onKeyDown={tastatur}
          className="w-full bg-transparent py-3.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
        />
      </div>

      {treffer.length > 0 ? (
        <ul id={listeId} role="listbox" aria-label="Treffer" className="max-h-[min(24rem,55vh)] overflow-y-auto p-2">
          {treffer.map((t, i) => (
            <li
              key={`${t.art}-${t.href}`}
              id={optionId(i)}
              role="option"
              aria-selected={i === aktiverIndex}
              onMouseMove={() => i !== aktiverIndex && setAktiv(i)}
              onClick={() => oeffne(t)}
              className={cn("flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2", i === aktiverIndex && "bg-slate-800")}
            >
              <span className="min-w-0">
                <span className="block truncate text-sm text-slate-100">{t.titel}</span>
                <span className="block truncate text-xs text-slate-400">{t.kontext}</span>
              </span>
              {t.art !== "tool" && <span className="shrink-0 text-xs text-slate-400">{t.art === "aktion" ? "Aktion" : "Bereich"}</span>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-4 py-6 text-center text-sm text-slate-400">Keine Treffer für „{anfrage.trim()}“.</p>
      )}

      <p aria-live="polite" className="sr-only">
        {anfrage.trim() ? `${treffer.length} Treffer` : ""}
      </p>
      <p className="border-t border-slate-800 px-4 py-2 text-xs text-slate-400">↑ ↓ auswählen · Enter öffnen · Esc schließen</p>
    </dialog>
  );
}
