import Link from "next/link";
import { cn } from "@/lib/cn";
import { istAktiv, toolsNachKategorie } from "@/lib/tool-registry";

/**
 * Alle Tools nach Kategorie in Spalten — dieselbe Darstellung im „Alle
 * Tools“-Panel der Kopfzeile (kompakt, einzeilige Beschreibung) und auf der
 * Startseite (je Kategorie ein Kasten, zweizeilige Beschreibung). Wächst je
 * Tool um eine Zeile in seiner Spalte statt um eine ganze Kartenreihe.
 * Ohne Hooks und Handler, damit sie in Server- und Client-Komponenten läuft.
 */
export function ToolKategorien({ variante, aktiverPfad }: { variante: "panel" | "startseite"; aktiverPfad?: string }) {
  const startseite = variante === "startseite";
  const Ueberschrift = startseite ? "h3" : "p";

  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4", startseite ? "gap-4" : "gap-x-6 gap-y-5")}>
      {toolsNachKategorie().map((k) => (
        <section key={k.id} aria-labelledby={`${variante}-${k.id}`} className={cn(startseite && "rounded-lg border border-slate-800 bg-slate-900/60 p-3")}>
          <Ueberschrift id={`${variante}-${k.id}`} className="mb-1.5 px-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            {k.label}
          </Ueberschrift>
          <ul className="flex flex-col gap-0.5">
            {k.tools.map((t) => {
              const aktiv = aktiverPfad !== undefined && istAktiv(t.href, aktiverPfad);
              return (
                <li key={t.href}>
                  <Link
                    href={t.href}
                    aria-current={aktiv ? "page" : undefined}
                    className={cn("block rounded-md px-2 py-1.5 transition-colors", aktiv ? "bg-slate-800" : "hover:bg-slate-800/70")}
                  >
                    <span className={cn("block text-sm text-slate-100", startseite && "font-medium")}>{t.titel}</span>
                    <span className={cn("text-xs text-slate-400", startseite ? "line-clamp-2" : "block truncate")}>{t.beschreibung}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
