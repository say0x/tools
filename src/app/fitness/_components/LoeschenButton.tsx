"use client";

import { useTransition } from "react";
import { loescheFitnessEintragAction } from "@/server/actions/fitness";

export function LoeschenButton({
  art,
  id,
  bezeichnung,
}: {
  art: "gewicht" | "mahlzeit" | "training" | "lebensmittel";
  id: string;
  bezeichnung: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      aria-label={`${bezeichnung} löschen`}
      title="Löschen"
      onClick={() => {
        if (!window.confirm(`„${bezeichnung}“ wirklich löschen?`)) return;
        startTransition(async () => {
          const result = await loescheFitnessEintragAction(art, id);
          if (!result.success) window.alert(result.error);
        });
      }}
      className="rounded-md px-2 py-1 text-xs text-slate-400 hover:bg-red-950/40 hover:text-red-300 disabled:opacity-50"
    >
      {isPending ? "…" : "✕"}
    </button>
  );
}
