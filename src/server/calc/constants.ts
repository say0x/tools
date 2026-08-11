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

/**
 * Zusatzfaktor auf die Referenzkosten für Fenster, abhängig von der
 * Verglasungsart — unabhängig vom optisch/technisch bewerteten Zustand, da
 * Einfachverglasung energetisch unabhängig vom äußeren Zustand ersetzt werden
 * sollte, während Dreifachverglasung meist keinen vollständigen Austausch
 * braucht. Nur relevant, wenn kein manueller Kosten-Override gesetzt ist.
 */
export const VERGLASUNG_KOSTENFAKTOR: Record<string, number> = {
  EINFACH: 1.15,
  DOPPEL: 1.0,
  DREIFACH: 0.7,
};

/** Ab dieser Haltedauer (Jahre) entfällt die Spekulationssteuer auf Immobiliengewinne (§23 EStG). */
export const SPEKULATIONSFRIST_JAHRE = 10;

/**
 * Maximaler Betrachtungszeitraum für Tilgungsplan/Vermögensverlauf. Die
 * Engine berechnet immer den vollen Horizont; die Chart-UI schneidet client-
 * seitig auf den vom Nutzer gewählten Betrachtungszeitraum (max. 50 Jahre) zu.
 */
export const VERMOEGENSVERLAUF_MAX_JAHRE = 50;

/** Vordefinierte Schnellauswahl-Werte für den Betrachtungszeitraum-Regler. */
export const BETRACHTUNGSZEITRAUM_PRESETS = [1, 5, 10, 15, 30, 50] as const;
