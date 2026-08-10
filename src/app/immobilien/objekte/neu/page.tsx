import { PropertyForm } from "@/components/forms/PropertyForm";
import { defaultPropertyFormValues } from "@/lib/property-form-defaults";
import { ladeProfil } from "@/server/actions/profile";
import { erstelleObjekt } from "@/server/actions/property";
import { ladeReferenceDataSnapshot } from "@/server/data/reference-data";
import { toProfileInput } from "@/server/data/mappers";

export const dynamic = "force-dynamic";

export default async function NeuesObjektPage() {
  const [profilRow, referenceData] = await Promise.all([ladeProfil(), ladeReferenceDataSnapshot()]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Neues Objekt</h1>
        <p className="mt-1 text-slate-400">Alle Angaben erfassen — Kennzahlen rechts werden live aktualisiert.</p>
      </div>
      <PropertyForm
        defaultValues={defaultPropertyFormValues()}
        profile={toProfileInput(profilRow)}
        referenceData={referenceData}
        onSubmit={erstelleObjekt}
        submitLabel="Objekt anlegen"
      />
    </div>
  );
}
