"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";
import { toolBereiche } from "@/lib/tool-registry";

const TABS = toolBereiche("/fitness");

/** Behält ?datum= beim Wechsel zwischen Tagesansichten bei (Heute ↔ Ernährung). */
const DATUMSBEZOGEN = new Set(["/fitness", "/fitness/ernaehrung"]);

export function FitnessTabs() {
  const pathname = usePathname();
  const datum = useSearchParams().get("datum");

  return (
    <nav aria-label="Fitness-Bereiche" className="-mx-1 flex gap-1 overflow-x-auto border-b border-slate-800 pb-2">
      {TABS.map((tab) => {
        const aktiv = pathname === tab.href;
        const href = datum && DATUMSBEZOGEN.has(tab.href) ? `${tab.href}?datum=${datum}` : tab.href;
        return (
          <Link
            key={tab.href}
            href={href}
            aria-current={aktiv ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-md px-3 py-1.5 text-sm transition-colors",
              aktiv ? "bg-slate-800 text-slate-100" : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
