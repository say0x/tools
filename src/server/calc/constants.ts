// Zentrale Geschäftsregel-Konstanten der Calc-Engine — bewusst als Code
// gepflegt (nicht als DB-Tabelle), weil es feste Annahmen/Formeln statt
// editierbarer Standortdaten sind.

/**
 * Ohne separate Grundstücks-/Gebäudewert-Angabe wird für die AfA-
 * Bemessungsgrundlage ein pauschaler Gebäudeanteil am Kaufpreis angenommen.
 * Üblicher Näherungswert für Wohnimmobilien; im Einzelfall (Kaufvertrag mit
 * Aufteilung, Bodenrichtwert) abweichend.
 */
export const GEBAEUDEANTEIL_PROZENT = 80;

/** Zustandsnote (1 sehr gut – 6 sehr schlecht) -> Anteil der Referenzkosten, der als Sanierungsbedarf angesetzt wird. */
export const ZUSTANDSFAKTOR: Record<number, number> = {
  1: 0,
  2: 0.1,
  3: 0.3,
  4: 0.55,
  5: 0.8,
  6: 1.0,
};

/** Ab dieser Haltedauer (Jahre) entfällt die Spekulationssteuer auf Immobiliengewinne (§23 EStG). */
export const SPEKULATIONSFRIST_JAHRE = 10;

/** Horizont für den Vermögensverlauf-Chart, wenn kein Exit-Datum vorgegeben ist. */
export const VERMOEGENSVERLAUF_STANDARD_JAHRE = 30;
