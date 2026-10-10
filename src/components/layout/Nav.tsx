"use client";

// Aufbau und Skalierungsregeln der Navigation: ADR-0012, docs/tools/weitere-rechner.md.
// Welche Tools es gibt, steht ausschließlich in src/lib/tool-registry.ts.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";
import { KOPFZEILEN_TOOLS, STARTSEITE, istAktiv, toolFuerPfad } from "@/lib/tool-registry";
import { ToolKategorien } from "./ToolKategorien";
import { ToolSuche, merkeBesuch } from "./ToolSuche";

const PANEL_ID = "alle-tools";

const istMacSnapshot = () => /Mac|iPhone|iPad/.test(navigator.platform);
const keinAbo = () => () => {};

/** Tastenkürzel „/“ nur, wenn gerade nicht in ein Feld getippt wird. */
function tipptGerade(ziel: EventTarget | null): boolean {
  return ziel instanceof HTMLElement && (ziel.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(ziel.tagName));
}

export function Nav({ userSwitcher }: { userSwitcher: React.ReactNode }) {
  const pathname = usePathname();
  // Das Panel gilt nur für den Pfad, auf dem es geöffnet wurde — nach einer Navigation ist es zu, ohne Effekt.
  const [panelPfad, setPanelPfad] = useState<string | null>(null);
  const panelOffen = panelPfad === pathname;
  const [sucheOffen, setSucheOffen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const panelKnopfRef = useRef<HTMLButtonElement>(null);
  const istMac = useSyncExternalStore(keinAbo, istMacSnapshot, () => false);

  const isActive = (href: string) => istAktiv(href, pathname);

  useEffect(() => {
    const tool = toolFuerPfad(pathname);
    if (tool) merkeBesuch(tool.href);
  }, [pathname]);

  useEffect(() => {
    const taste = (e: KeyboardEvent) => {
      const kuerzel = (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey && !tipptGerade(e.target));
      if (!kuerzel) return;
      e.preventDefault();
      setPanelPfad(null);
      setSucheOffen(true);
    };
    document.addEventListener("keydown", taste);
    return () => document.removeEventListener("keydown", taste);
  }, []);

  useEffect(() => {
    if (!panelOffen) return;
    const klick = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) setPanelPfad(null);
    };
    const taste = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setPanelPfad(null);
      panelKnopfRef.current?.focus();
    };
    document.addEventListener("mousedown", klick);
    document.addEventListener("keydown", taste);
    return () => {
      document.removeEventListener("mousedown", klick);
      document.removeEventListener("keydown", taste);
    };
  }, [panelOffen]);

  const linkClass = (active: boolean) =>
    cn(
      "whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition-colors",
      active ? "bg-slate-800 text-slate-100" : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
    );
  const knopfClass = "flex items-center gap-2 whitespace-nowrap rounded-md border border-slate-800 px-2.5 py-1.5 text-sm text-slate-300 transition-colors hover:bg-slate-800";

  return (
    // relative z-40: backdrop-blur erzeugt einen eigenen Stapelkontext — ohne z-index würden Seiteninhalte
    // mit eigener Ebene (opacity, transform, position) über Panel und Menüs dieser Kopfzeile gezeichnet.
    <header ref={headerRef} className="relative z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-3">
        <Link href={STARTSEITE.href} className="text-lg font-semibold tracking-tight text-slate-100">
          tools<span className="text-blue-500">.</span>
        </Link>

        <div className="hidden sm:block">{userSwitcher}</div>

        <nav aria-label="Hauptnavigation" className="ml-auto hidden items-center gap-1 lg:flex">
          <Link href={STARTSEITE.href} aria-current={isActive(STARTSEITE.href) ? "page" : undefined} className={linkClass(isActive(STARTSEITE.href))}>
            {STARTSEITE.label}
          </Link>
          {KOPFZEILEN_TOOLS.map((tool) => (
            <Link key={tool.href} href={tool.href} aria-current={isActive(tool.href) ? "page" : undefined} className={linkClass(isActive(tool.href))}>
              {tool.navLabel}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-2">
          <button
            type="button"
            onClick={() => {
              setPanelPfad(null);
              setSucheOffen(true);
            }}
            aria-keyshortcuts="Control+K Meta+K /"
            className={knopfClass}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="7" />
              <path strokeLinecap="round" d="M20 20l-3.5-3.5" />
            </svg>
            <span className="sr-only md:not-sr-only">Suchen</span>
            <kbd className="hidden rounded border border-slate-700 px-1.5 font-sans text-xs text-slate-400 xl:inline">{istMac ? "⌘K" : "Strg K"}</kbd>
          </button>

          <button
            ref={panelKnopfRef}
            type="button"
            onClick={() => setPanelPfad(panelOffen ? null : pathname)}
            aria-expanded={panelOffen}
            aria-controls={PANEL_ID}
            className={cn(knopfClass, panelOffen && "bg-slate-800 text-slate-100")}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="currentColor">
              {[4, 10, 16].flatMap((y) => [4, 10, 16].map((x) => <rect key={`${x}-${y}`} x={x} y={y} width="4" height="4" rx="1" />))}
            </svg>
            <span className="sr-only sm:not-sr-only">Alle Tools</span>
          </button>
        </div>
      </div>

      {panelOffen && (
        <nav
          id={PANEL_ID}
          aria-label="Alle Tools"
          // Klick auf einen Link schließt das Panel auch dann, wenn er zur aktuellen Seite führt.
          onClick={(e) => {
            if ((e.target as Element).closest("a")) setPanelPfad(null);
          }}
          className="absolute inset-x-0 top-full border-b border-slate-800 bg-slate-950 shadow-xl shadow-black/40"
        >
          <div className="mx-auto max-h-[calc(100dvh-4.5rem)] max-w-6xl overflow-y-auto px-6 py-5">
            <div className="mb-4 sm:hidden">{userSwitcher}</div>
            <ToolKategorien variante="panel" aktiverPfad={pathname} />
          </div>
        </nav>
      )}

      {sucheOffen && <ToolSuche onSchliessen={() => setSucheOffen(false)} />}
    </header>
  );
}
