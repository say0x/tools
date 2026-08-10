"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { dupliziereObjekt } from "@/server/actions/property";

export function DuplicateObjectButton({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const newId = await dupliziereObjekt(id);
          router.push(`/immobilien/objekte/${newId}`);
        });
      }}
    >
      {isPending ? "…" : "Duplizieren"}
    </Button>
  );
}
