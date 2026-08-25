"use client";

// Referenz (App-weite Fehlerbehandlung): docs/tools/weitere-rechner.md

import { useEffect } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col gap-6">
      <Card className="border-red-900/50 bg-red-950/20">
        <CardTitle>Etwas ist schiefgelaufen</CardTitle>
        <p className="text-sm text-slate-300">
          Diese Seite konnte nicht geladen werden. Das kann an einer vorübergehenden Störung liegen — ein erneuter
          Versuch hilft oft schon.
        </p>
        {error.digest && <p className="mt-2 text-xs text-slate-500">Fehler-ID: {error.digest}</p>}
        <Button className="mt-4" onClick={reset}>
          Erneut versuchen
        </Button>
      </Card>
    </div>
  );
}
