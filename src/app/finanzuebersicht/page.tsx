import { VERMOEGENSVERLAUF_MAX_JAHRE } from "@/server/calc/constants";
import { ladeProfil } from "@/server/actions/profile";
import { ladeSparpositionen } from "@/server/actions/finanzuebersicht";
import { ladeObjekte } from "@/server/data/property";
import { ladeReferenceDataSnapshot } from "@/server/data/reference-data";
import { toProfileInput, toSparpositionFormValues } from "@/server/data/mappers";
import { berechneImmobilienPositionen } from "@/server/data/vermoegen";
import { FinanzuebersichtClient } from "./FinanzuebersichtClient";

export const dynamic = "force-dynamic";

export default async function FinanzuebersichtPage() {
  const [propertyRows, profilRow, referenceData, sparpositionenRows] = await Promise.all([
    ladeObjekte(),
    ladeProfil(),
    ladeReferenceDataSnapshot(),
    ladeSparpositionen(),
  ]);

  const profile = toProfileInput(profilRow);
  const heute = new Date();

  const immobilien = berechneImmobilienPositionen(propertyRows, profile, referenceData, heute);

  const sparpositionen = toSparpositionFormValues(sparpositionenRows.wertpapiere, sparpositionenRows.tagesgeld);

  return (
    <FinanzuebersichtClient
      immobilien={immobilien}
      sparpositionenInitial={sparpositionen}
      bruttoEinkommenMonatlichInitial={profilRow?.bruttoEinkommenMonatlich ?? 0}
      gehaltssteigerungProzentJaehrlichInitial={profilRow?.gehaltssteigerungProzentJaehrlich ?? 2}
      inflationProzentJaehrlichInitial={profilRow?.inflationProzentJaehrlich ?? 2}
      maxHorizontJahre={VERMOEGENSVERLAUF_MAX_JAHRE}
      startjahr={heute.getFullYear()}
    />
  );
}
