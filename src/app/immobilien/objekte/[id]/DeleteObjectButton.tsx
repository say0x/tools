"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { loescheObjekt } from "@/server/actions/property";

export function DeleteObjectButton({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="danger"
      size="sm"
      disabled={isPending}
      onClick={() => {
        if (!confirm("Objekt wirklich löschen?")) return;
        startTransition(async () => {
          await loescheObjekt(id);
          router.push("/immobilien/objekte");
        });
      }}
    >
      {isPending ? "Löscht…" : "Objekt löschen"}
    </Button>
  );
}
