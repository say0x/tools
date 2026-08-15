import { differenceInCalendarYears } from "date-fns";
import { berechneObjekt } from "@/server/calc/engine";
import { VERMOEGENSVERLAUF_MAX_JAHRE } from "@/server/calc/constants";
import { ladeProfil } from "@/server/actions/profile";
import { ladeSparpositionen } from "@/server/actions/finanzuebersicht";
import { ladeObjekte } from "@/server/data/property";
import { ladeReferenceDataSnapshot } from "@/server/data/reference-data";
import { toProfileInput, toPropertyInput, toSparpositionFormValues } from "@/server/data/mappers";
import { FinanzuebersichtClient, type ImmobilienPosition } from "./FinanzuebersichtClient";

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

  const immobilien: ImmobilienPosition[] = propertyRows.map((row) => {
    const result = berechneObjekt(toPropertyInput(row), profile, referenceData);
    // Negativ = Kaufdatum liegt in der Zukunft (geplanter Kauf).
    const jahreSeitKauf = differenceInCalendarYears(heute, row.kaufdatum);
    return {
      id: row.id,
      name: row.asset.name,
      inFinanzuebersicht: row.inFinanzuebersicht,
      jahreSeitKauf,
      eigenkapitalEinsatzBeiKauf: result.finanzierung.eigenkapitalEinsatzEuro,
      cashflowNachSteuerProJahrSeitKauf: result.vermoegensverlauf.map((jahr) => jahr.cashflowNachSteuerJahr),
      // Referenzwert für die Anzeige (heutiger Eigenkapitalanteil) — fließt NICHT in die Cashflow-Summe ein.
      eigenkapitalanteilHeuteReferenz:
        jahreSeitKauf >= 1
          ? (result.vermoegensverlauf[Math.min(jahreSeitKauf, result.vermoegensverlauf.length) - 1]?.eigenkapitalanteil ?? result.finanzierung.eigenkapitalEinsatzEuro)
          : result.finanzierung.eigenkapitalEinsatzEuro,
    };
  });

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
