import Link from "next/link";
import { notFound } from "next/navigation";
import { VERMOEGENSVERLAUF_MAX_JAHRE } from "@/server/calc/constants";
import { ladeProfil } from "@/server/actions/profile";
import { aktualisiereSzenario, ladeSzenario, type SzenarioAenderungFormValues } from "@/server/actions/szenario";
import { ladeSparpositionen } from "@/server/actions/finanzuebersicht";
import { ladeObjekte } from "@/server/data/property";
import { ladeReferenceDataSnapshot } from "@/server/data/reference-data";
import { toProfileInput } from "@/server/data/mappers";
import { berechneImmobilienPositionen, berechneSparpositionPositionen } from "@/server/data/vermoegen";
import { DeleteSzenarioButton } from "./DeleteSzenarioButton";
import { SzenarioClient } from "./SzenarioClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "Szenario bearbeiten" };

export default async function SzenarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [szenario, propertyRows, sparpositionenRows, profilRow, referenceData] = await Promise.all([
    ladeSzenario(id),
    ladeObjekte(),
    ladeSparpositionen(),
    ladeProfil(),
    ladeReferenceDataSnapshot(),
  ]);

  if (!szenario) notFound();

  const profile = toProfileInput(profilRow);
  const heute = new Date();
  const aktuellesJahr = heute.getFullYear();

  const immobilien = berechneImmobilienPositionen(propertyRows, profile, referenceData, heute);
  const sparpositionen = berechneSparpositionPositionen(sparpositionenRows.wertpapiere, sparpositionenRows.tagesgeld);

  // jahrAbHeute (DB) -> Kalenderjahr (UI) — im Formular tippt man ein reales Jahr, keine Jahresdifferenz.
  const aenderungenInitial: SzenarioAenderungFormValues[] = szenario.aenderungen.map((a) => ({
    typ: a.typ,
    assetId: a.assetId,
    neueSparrateMonatlich: a.neueSparrateMonatlich?.toNumber() ?? null,
    jahrAbHeute: a.jahrAbHeute == null ? null : aktuellesJahr + a.jahrAbHeute,
    bezeichnung: a.bezeichnung,
    betrag: a.betrag?.toNumber() ?? null,
  }));

  const updateAction = aktualisiereSzenario.bind(null, id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/szenarien" className="text-sm text-blue-400 hover:underline">
            ← zurück zu den Szenarien
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-slate-100">{szenario.name}</h1>
          <p className="mt-1 text-slate-400">
            Verändert nie deine echten Daten — rechnet nur zusätzlich mit den Änderungen unten.
          </p>
        </div>
        <DeleteSzenarioButton id={id} />
      </div>

      <SzenarioClient
        onSubmit={updateAction}
        nameInitial={szenario.name}
        startjahrInitial={szenario.startjahr}
        notizenInitial={szenario.notizen}
        aenderungenInitial={aenderungenInitial}
        immobilien={immobilien}
        sparpositionen={sparpositionen}
        maxHorizontJahre={VERMOEGENSVERLAUF_MAX_JAHRE}
        aktuellesJahr={aktuellesJahr}
      />
    </div>
  );
}
