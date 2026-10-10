"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";
import { TOOLS } from "@/lib/tool-registry";

/**
 * Tab-Leiste für Tools mit mehreren Bereichen — Einträge aus `bereiche` der
 * Tool-Registry. Braucht wegen useSearchParams() eine Suspense-Grenze.
 */
export function ToolTabs({ toolHref }: { toolHref: string }) {
  const pathname = usePathname();
  const parameter = useSearchParams();
  const tool = TOOLS.find((t) => t.href === toolHref);
  if (!tool?.bereiche) return null;

  return (
    <nav aria-label={`${tool.navLabel}-Bereiche`} className="-mx-1 flex gap-1 overflow-x-auto border-b border-slate-800 pb-2">
      {tool.bereiche.map((bereich) => {
        const aktiv = pathname === bereich.href;
        const behalten = (bereich.behaeltParameter ?? []).flatMap((name) => {
          const wert = parameter.get(name);
          return wert ? [[name, wert]] : [];
        });
        const href = behalten.length > 0 ? `${bereich.href}?${new URLSearchParams(behalten)}` : bereich.href;
        return (
          <Link
            key={bereich.href}
            href={href}
            aria-current={aktiv ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-md px-3 py-1.5 text-sm transition-colors",
              aktiv ? "bg-slate-800 text-slate-100" : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
            )}
          >
            {bereich.label}
          </Link>
        );
      })}
    </nav>
  );
}
