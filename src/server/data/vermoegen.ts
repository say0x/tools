import { differenceInCalendarYears } from "date-fns";
import { berechneObjekt } from "@/server/calc/engine";
import type { CalculationResult, ProfileInput, ReferenceDataSnapshot } from "@/server/calc/types";
import type { Asset, Tagesgeldkonto, Wertpapierposition } from "@/generated/prisma/client";
import type { Besitzstatus } from "@/lib/asset";
import type { SparpositionArt } from "@/server/actions/finanzuebersicht-schema";
import { toPropertyInput, type PropertyWithAsset } from "./mappers";

// Referenz (Cashflow-only-Philosophie, geteilte Bausteine, Besitzstatus-System): docs/tools/finanzuebersicht-und-szenarien.md

export interface ImmobilienPosition {
  id: string;
  assetId: string;
  name: string;
  besitzstatus: Besitzstatus;
  /** Jahre seit Kauf, ab heute — negativ bei einem geplanten (zukünftigen) Kauf. */
  jahreSeitKauf: number;
  kaufpreis: number;
  eigenkapitalEinsatzBeiKauf: number;
  cashflowNachSteuerProJahrSeitKauf: number[];
  /** Reine Referenzwerte (heutiger Stand) — fließen NICHT in die Summe ein, nur der Cashflow zählt. */
  eigenkapitalanteilHeuteReferenz: number;
  immobilienwertHeuteReferenz: number;
  /** EK-Anteil je Jahr seit Kauf (Index 0 = Jahr 1) — Referenzverlauf für Anzeige, z. B. im Szenario-Vergleich. */
  eigenkapitalanteilProJahrSeitKauf: number[];
}

/**
 * Wandelt ein bereits berechnetes Engine-Ergebnis in das Positions-Format um,
 * das sowohl die Finanzübersicht als auch der Szenario-Editor brauchen:
 * Cashflow-Verlauf ab Kauf + reine Referenzwerte (Kaufpreis/Marktwert/EK-
 * Anteil heute). Getrennt von {@link berechneImmobilienPositionen}, damit
 * Aufrufer, die `berechneObjekt()` ohnehin schon für andere Kennzahlen
 * (z. B. Ampel, Bruttorendite) gerechnet haben, dieses Ergebnis wiederverwenden
 * können, statt die kostenintensive 50-Jahres-Berechnung ein zweites Mal
 * anzustoßen.
 */
export function immobilienPositionAusErgebnis(
  row: PropertyWithAsset,
  result: CalculationResult,
  heute: Date = new Date()
): ImmobilienPosition {
  // Negativ = Kaufdatum liegt in der Zukunft (geplanter Kauf).
  const jahreSeitKauf = differenceInCalendarYears(heute, row.kaufdatum);
  // Heutiger Stand im vorhandenen Vermögensverlauf der Objekt-Engine (Jahr 1..50 seit Kauf) nachschlagen —
  // reine Referenzwerte für die Anzeige, fließen NICHT in die Cashflow-Summe ein.
  const heutigerVermoegensverlaufEintrag =
    jahreSeitKauf >= 1 ? result.vermoegensverlauf[Math.min(jahreSeitKauf, result.vermoegensverlauf.length) - 1] : undefined;
  return {
    id: row.id,
    assetId: row.assetId,
    name: row.asset.name,
    besitzstatus: row.asset.besitzstatus,
    jahreSeitKauf,
    kaufpreis: row.kaufpreis,
    eigenkapitalEinsatzBeiKauf: result.finanzierung.eigenkapitalEinsatzEuro,
    cashflowNachSteuerProJahrSeitKauf: result.vermoegensverlauf.map((jahr) => jahr.cashflowNachSteuerJahr),
    eigenkapitalanteilHeuteReferenz: heutigerVermoegensverlaufEintrag?.eigenkapitalanteil ?? result.finanzierung.eigenkapitalEinsatzEuro,
    immobilienwertHeuteReferenz: heutigerVermoegensverlaufEintrag?.immobilienwert ?? row.kaufpreis,
    eigenkapitalanteilProJahrSeitKauf: result.vermoegensverlauf.map((jahr) => jahr.eigenkapitalanteil),
  };
}

/**
 * Bereitet Immobilien-Objekte (jeden Besitzstatus, nicht nur "Besitze ich")
 * zu dem Positions-Format auf — berechnet `berechneObjekt()` dafür selbst.
 * Für Aufrufer, die das Engine-Ergebnis bereits haben, {@link immobilienPositionAusErgebnis}
 * direkt verwenden, um die Berechnung nicht zu duplizieren.
 */
export function berechneImmobilienPositionen(
  propertyRows: PropertyWithAsset[],
  profile: ProfileInput,
  referenceData: ReferenceDataSnapshot,
  heute: Date = new Date()
): ImmobilienPosition[] {
  return propertyRows.map((row) =>
    immobilienPositionAusErgebnis(row, berechneObjekt(toPropertyInput(row), profile, referenceData), heute)
  );
}

export interface SparpositionPosition {
  assetId: string;
  name: string;
  art: SparpositionArt;
  besitzstatus: Besitzstatus;
  betrag: number;
  renditeProzentJaehrlich: number;
  sparplanBetragMonatlich: number;
  sparplanSteigerungProzentJaehrlich: number;
}

/**
 * Wertpapier-/Tagesgeld-Positionen (jeden Besitzstatus) im Rohformat, das der
 * Szenario-Editor braucht, um eine bestehende Position per assetId
 * referenzieren zu können (z. B. für "Sparrate ändern"). Die Finanzübersicht
 * selbst braucht das nicht — sie hat mit `toSparpositionFormValues` bereits
 * ein eigenes Format fürs Bulk-Bearbeitungsformular.
 */
export function berechneSparpositionPositionen(
  wertpapiere: (Wertpapierposition & { asset: Asset })[],
  tagesgeld: (Tagesgeldkonto & { asset: Asset })[]
): SparpositionPosition[] {
  return [
    ...wertpapiere.map((w) => ({
      assetId: w.assetId,
      name: w.asset.name,
      art: "WERTPAPIERDEPOT" as const,
      besitzstatus: w.asset.besitzstatus,
      betrag: w.betrag,
      renditeProzentJaehrlich: w.renditeProzentJaehrlich,
      sparplanBetragMonatlich: w.sparplanBetragMonatlich,
      sparplanSteigerungProzentJaehrlich: w.sparplanSteigerungProzentJaehrlich,
    })),
    ...tagesgeld.map((t) => ({
      assetId: t.assetId,
      name: t.asset.name,
      art: "TAGESGELD" as const,
      besitzstatus: t.asset.besitzstatus,
      betrag: t.betrag,
      renditeProzentJaehrlich: t.zinsProzentJaehrlich,
      sparplanBetragMonatlich: t.sparplanBetragMonatlich,
      sparplanSteigerungProzentJaehrlich: t.sparplanSteigerungProzentJaehrlich,
    })),
  ];
}
