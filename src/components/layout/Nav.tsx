"use client";

// Referenz (Gruppen der Navigation, warum ein eigener Dropdown statt externer Bibliothek): docs/tools/weitere-rechner.md
// Welche Links es gibt, steht ausschließlich in src/lib/tool-registry.ts.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { HAUPT_TOOLS, TOOLS, WEITERE_TOOLS, istAktiv, type Tool } from "@/lib/tool-registry";

/** Trennlinie vor dem ersten Eintrag einer neuen Gruppe. */
const neueGruppe = (liste: readonly Tool[], i: number) => i > 0 && liste[i].gruppe !== liste[i - 1].gruppe;

export function Nav({ userSwitcher }: { userSwitcher: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) => istAktiv(href, pathname);
  const moreIsActive = WEITERE_TOOLS.some((tool) => isActive(tool.href));

  useEffect(() => {
    if (!moreOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoreOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [moreOpen]);

  const linkClass = (active: boolean) =>
    cn(
      "rounded-md px-3 py-1.5 text-sm transition-colors",
      active ? "bg-slate-800 text-slate-100" : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
    );

  return (
    // relative z-40: backdrop-blur erzeugt einen eigenen Stapelkontext — ohne z-index würden Seiteninhalte
    // mit eigener Ebene (opacity, transform, position) über die Menüs dieser Kopfzeile gezeichnet.
    <header className="relative z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight text-slate-100">
          tools<span className="text-blue-500">.</span>
        </Link>

        <div className="hidden sm:block">{userSwitcher}</div>

        <nav aria-label="Hauptnavigation" className="hidden gap-1 sm:flex sm:items-center">
          {HAUPT_TOOLS.map((tool) => (
            <Link key={tool.href} href={tool.href} aria-current={isActive(tool.href) ? "page" : undefined} className={linkClass(isActive(tool.href))}>
              {tool.navLabel}
            </Link>
          ))}

          <div className="relative" ref={moreRef}>
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={moreOpen}
              className={cn(linkClass(moreIsActive), "flex items-center gap-1")}
            >
              Weitere Tools
              <svg viewBox="0 0 24 24" className={cn("h-3.5 w-3.5 transition-transform", moreOpen && "rotate-180")} fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {moreOpen && (
              <div
                role="menu"
                className="absolute right-0 z-40 mt-2 w-56 rounded-md border border-slate-800 bg-slate-900 p-1 shadow-lg shadow-black/30"
              >
                {WEITERE_TOOLS.map((tool, i) => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    role="menuitem"
                    aria-current={isActive(tool.href) ? "page" : undefined}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "block rounded-md px-3 py-2 text-sm transition-colors",
                      neueGruppe(WEITERE_TOOLS, i) && "mt-1 border-t border-slate-800 pt-2",
                      isActive(tool.href) ? "bg-slate-800 text-slate-100" : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                    )}
                  >
                    {tool.navLabel}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Menü schließen" : "Menü öffnen"}
          aria-expanded={mobileOpen}
          className="flex h-9 w-9 items-center justify-center rounded-md text-slate-300 hover:bg-slate-800 sm:hidden"
        >
          {mobileOpen ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
            </svg>
          )}
        </button>
      </div>

      {mobileOpen && (
        <nav aria-label="Hauptnavigation (mobil)" className="flex flex-col gap-3 border-t border-slate-800 px-6 py-3 sm:hidden">
          <div>{userSwitcher}</div>
          {TOOLS.map((tool, i) => (
            <Link
              key={tool.href}
              href={tool.href}
              aria-current={isActive(tool.href) ? "page" : undefined}
              onClick={() => setMobileOpen(false)}
              className={cn(linkClass(isActive(tool.href)), neueGruppe(TOOLS, i) && "mt-1 border-t border-slate-800 pt-3")}
            >
              {tool.navLabel}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
