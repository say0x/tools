import Link from "next/link";
import { notFound } from "next/navigation";
import { PropertyForm } from "@/components/forms/PropertyForm";
import { ladeProfil } from "@/server/actions/profile";
import { aktualisiereObjekt } from "@/server/actions/property";
import { ladeObjekt } from "@/server/data/property";
import { ladeReferenceDataSnapshot } from "@/server/data/reference-data";
import { toProfileInput, toPropertyFormValues } from "@/server/data/mappers";
import { DeleteObjectButton } from "./DeleteObjectButton";
import { DuplicateObjectButton } from "../DuplicateObjectButton";

export async function generateMetadata({ params }: PageProps<"/immobilien/objekte/[id]">) {
  const { id } = await params;
  const row = await ladeObjekt(id);
  return { title: row?.asset.name ?? "Objekt" };
}

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
          <Link href="/immobilien/objekte" className="text-sm text-blue-400 hover:underline">
            ← zurück zur Bibliothek
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-slate-100">{row.asset.name}</h1>
          <p className="mt-1 text-slate-400">Kennzahlen aktualisieren sich live mit jeder Änderung.</p>
        </div>
        <div className="flex gap-2">
          <DuplicateObjectButton id={id} />
          <DeleteObjectButton id={id} />
        </div>
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
