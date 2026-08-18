"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { loescheSzenario } from "@/server/actions/szenario";

export function DeleteSzenarioButton({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="danger"
      size="sm"
      disabled={isPending}
      onClick={() => {
        if (!confirm("Szenario wirklich löschen? Die echten Daten (Immobilien, Depots) bleiben davon unberührt.")) return;
        startTransition(async () => {
          await loescheSzenario(id);
          router.push("/szenarien");
        });
      }}
    >
      {isPending ? "Löscht…" : "Szenario löschen"}
    </Button>
  );
}
