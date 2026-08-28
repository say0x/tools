"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { erstelleSzenario, type SzenarioFormValues } from "@/server/actions/szenario";
import { szenarioSchema } from "@/server/actions/szenario-schema";
import { defaultSzenarioFormValues } from "@/lib/szenario-form-defaults";

export function NeuesSzenarioForm() {
  const [isPending, startTransition] = useTransition();
  const [serverFehler, setServerFehler] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SzenarioFormValues>({
    defaultValues: defaultSzenarioFormValues(),
    resolver: zodResolver(szenarioSchema),
  });

  const submit = handleSubmit((values) => {
    setServerFehler(null);
    startTransition(async () => {
      const result = await erstelleSzenario(values);
      if (!result.success) {
        setServerFehler(result.error);
      }
    });
  });

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      {serverFehler && (
        <Card className="border-red-900/50 bg-red-950/20">
          <p className="text-sm text-red-300">{serverFehler}</p>
        </Card>
      )}
      <Card>
        <div className="grid grid-cols-1 gap-4">
          <Field label="Name" error={errors.name?.message}>
            <Input {...register("name")} placeholder="z. B. Wohnung Hamburg kaufen 2028" />
          </Field>
          <Field
            label="Startjahr"
            hint="Ab diesem Jahr wirken Änderungen wie eine geänderte Sparrate. Käufe/Verkäufe/Anschaffungen haben ihren eigenen Zeitpunkt."
            error={errors.startjahr?.message}
          >
            <Input type="number" {...register("startjahr", { valueAsNumber: true })} />
          </Field>
          <Field label="Notizen" error={errors.notizen?.message}>
            <Textarea {...register("notizen")} rows={3} placeholder="Worum geht es in diesem Szenario?" />
          </Field>
        </div>
      </Card>
      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Wird angelegt…" : "Szenario anlegen"}
      </Button>
    </form>
  );
}
