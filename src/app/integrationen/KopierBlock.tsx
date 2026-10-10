"use client";

import { useState } from "react";

/** Codeblock mit Kopieren-Knopf (Clipboard-API; ohne sichere Herkunft per Textauswahl-Fallback). */
export function KopierBlock({ titel, inhalt }: { titel?: string; inhalt: string }) {
  const [status, setStatus] = useState<"bereit" | "kopiert" | "fehler">("bereit");

  const kopieren = async () => {
    try {
      await navigator.clipboard.writeText(inhalt);
      setStatus("kopiert");
    } catch {
      setStatus("fehler");
    }
    setTimeout(() => setStatus("bereit"), 2000);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        {titel ? <span className="text-sm text-slate-300">{titel}</span> : <span />}
        <button
          type="button"
          onClick={kopieren}
          className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200 hover:bg-slate-700"
          aria-label={titel ? `${titel} kopieren` : "Kopieren"}
        >
          {status === "kopiert" ? "Kopiert ✓" : status === "fehler" ? "Bitte manuell markieren" : "Kopieren"}
        </button>
      </div>
      <pre
        tabIndex={0}
        className="max-h-96 overflow-auto rounded-md border border-slate-800 bg-slate-950 p-3 text-xs leading-relaxed text-slate-200"
      >
        <code>{inhalt}</code>
      </pre>
    </div>
  );
}
