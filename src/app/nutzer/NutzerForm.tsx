"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { erstelleNutzer, wechsleNutzer } from "@/server/actions/user";

export function NutzerForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [fehler, setFehler] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFehler(null);
    startTransition(async () => {
      const result = await erstelleNutzer(name);
      if (!result.success) {
        setFehler(result.error);
        return;
      }
      // Neu angelegten Test-User direkt aktivieren, statt den Nutzer zu
      // zwingen, ihn danach separat in der Liste zu aktivieren.
      const wechselErgebnis = await wechsleNutzer(result.data.id);
      if (!wechselErgebnis.success) {
        setFehler(wechselErgebnis.error);
        return;
      }
      setName("");
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      <div className="flex-1">
        <label htmlFor="nutzer-name" className="mb-1.5 block text-sm text-slate-400">
          Name
        </label>
        <Input
          id="nutzer-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z. B. Test-User B"
          disabled={isPending}
        />
      </div>
      <Button type="submit" disabled={isPending || name.trim() === ""}>
        Anlegen &amp; aktivieren
      </Button>
      {fehler && <p className="text-sm text-red-400">{fehler}</p>}
    </form>
  );
}
