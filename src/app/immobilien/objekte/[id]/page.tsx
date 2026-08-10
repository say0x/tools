import { notFound } from "next/navigation";
import { PropertyForm } from "@/components/forms/PropertyForm";
import { ladeProfil } from "@/server/actions/profile";
import { aktualisiereObjekt } from "@/server/actions/property";
import { ladeObjekt } from "@/server/data/property";
import { ladeReferenceDataSnapshot } from "@/server/data/reference-data";
import { toProfileInput, toPropertyFormValues } from "@/server/data/mappers";
import { DeleteObjectButton } from "./DeleteObjectButton";

export default async function ObjektDetailPage({ params }: PageProps<"/immobilien/objekte/[id]">) {
  const { id } = await params;

  const [row, profilRow, referenceData] = await Promise.all([
    ladeObjekt(id),
    ladeProfil(),
    ladeReferenceDataSnapshot(),
  ]);

  if (!row) notFound();

  const updateAction = aktualisiereObjekt.bind(null, id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">{row.asset.name}</h1>
          <p className="mt-1 text-slate-400">Kennzahlen aktualisieren sich live mit jeder Änderung.</p>
        </div>
        <DeleteObjectButton id={id} />
      </div>

      <PropertyForm
        defaultValues={toPropertyFormValues(row)}
        profile={toProfileInput(profilRow)}
        referenceData={referenceData}
        onSubmit={updateAction}
        submitLabel="Änderungen speichern"
        showCharts
      />
    </div>
  );
}
