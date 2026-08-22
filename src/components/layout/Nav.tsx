"use client";

// Referenz (primaryLinks/secondaryLinks-Aufteilung, warum ein eigener Dropdown statt externer Bibliothek): docs/weitere-rechner.md

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

const primaryLinks = [
  { href: "/", label: "Start" },
  { href: "/immobilien/objekte", label: "Immobilien" },
  { href: "/finanzuebersicht", label: "Finanzübersicht" },
  { href: "/szenarien", label: "Szenarien" },
];

const secondaryLinks = [
  { href: "/sparziel", label: "Sparziel-Rechner" },
  { href: "/steuerrechner", label: "Steuerrechner" },
  { href: "/kreditvergleich", label: "Kreditvergleich" },
  { href: "/kaufen-oder-anlegen", label: "Kaufen oder Anlegen" },
  { href: "/profil", label: "Profil" },
  { href: "/immobilien/referenzdaten", label: "Referenzdaten" },
];

const allLinks = [...primaryLinks, ...secondaryLinks];

export function Nav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const moreIsActive = secondaryLinks.some((link) => isActive(link.href));

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
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight text-slate-100">
          tools<span className="text-blue-500">.</span>
        </Link>

        <nav className="hidden gap-1 sm:flex sm:items-center">
          {primaryLinks.map((link) => (
            <Link key={link.href} href={link.href} aria-current={isActive(link.href) ? "page" : undefined} className={linkClass(isActive(link.href))}>
              {link.label}
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
                {secondaryLinks.map((link, i) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    role="menuitem"
                    aria-current={isActive(link.href) ? "page" : undefined}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "block rounded-md px-3 py-2 text-sm transition-colors",
                      i === 4 && "mt-1 border-t border-slate-800 pt-2",
                      isActive(link.href) ? "bg-slate-800 text-slate-100" : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                    )}
                  >
                    {link.label}
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
        <nav className="flex flex-col gap-1 border-t border-slate-800 px-6 py-3 sm:hidden">
          {allLinks.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              onClick={() => setMobileOpen(false)}
              className={cn(linkClass(isActive(link.href)), i === primaryLinks.length && "mt-1 border-t border-slate-800 pt-3")}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
