"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { addiereTage } from "@/server/calc/fitness/datum";
import { formatDatumLang } from "@/lib/fitness-labels";

export function DatumWaehler({ datum, heute }: { datum: string; heute: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const gehe = (ziel: string) => router.push(ziel === heute ? pathname : `${pathname}?datum=${ziel}`);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="secondary" size="sm" onClick={() => gehe(addiereTage(datum, -1))} aria-label="Vorheriger Tag">
        ←
      </Button>
      {/* Wrapper statt className: cn() merged keine Tailwind-Konflikte, w-full aus Input würde gewinnen. */}
      <div className="w-40">
        <Input type="date" value={datum} max={heute} onChange={(e) => e.target.value && gehe(e.target.value)} aria-label="Datum wählen" />
      </div>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => gehe(addiereTage(datum, 1))}
        disabled={datum >= heute}
        aria-label="Nächster Tag"
      >
        →
      </Button>
      {datum !== heute && (
        <Button type="button" variant="ghost" size="sm" onClick={() => gehe(heute)}>
          Heute
        </Button>
      )}
      <span className="text-sm text-slate-400">{formatDatumLang(datum)}</span>
    </div>
  );
}
