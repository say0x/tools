"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { exportiereAlleDaten } from "@/server/actions/export";

export function ExportButton() {
  const [isPending, startTransition] = useTransition();
  const [fehler, setFehler] = useState<string | null>(null);

  const handleExport = () => {
    setFehler(null);
    startTransition(async () => {
      try {
        const daten = await exportiereAlleDaten();
        const json = JSON.stringify(daten, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const datum = new Date().toISOString().slice(0, 10);
        const a = document.createElement("a");
        a.href = url;
        a.download = `tools-backup-${datum}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch (err) {
        setFehler(err instanceof Error ? err.message : "Export fehlgeschlagen.");
      }
    });
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <Button type="button" variant="secondary" disabled={isPending} onClick={handleExport}>
        {isPending ? "Exportiere…" : "Backup herunterladen (JSON)"}
      </Button>
      {fehler && <p className="text-xs text-red-400">{fehler}</p>}
    </div>
  );
}
