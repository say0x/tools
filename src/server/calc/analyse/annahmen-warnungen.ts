// Referenz: docs/tools/immobilien-rechner.md

const LEERSTAND_UNREALISTISCH_SCHWELLE_PROZENT = 1;
const WERTSTEIGERUNG_OPTIMISTISCH_SCHWELLE_PROZENT = 3;
const MIETSTEIGERUNG_OPTIMISTISCH_SCHWELLE_PROZENT = 3;

export interface AnnahmenWarnungLeerstand {
  typ: "LEERSTAND_UNREALISTISCH";
  leerstandsquoteProzent: number;
}

export interface AnnahmenWarnungWertsteigerung {
  typ: "WERTSTEIGERUNG_OPTIMISTISCH";
  wertsteigerungProzentJaehrlich: number;
}

export interface AnnahmenWarnungMietsteigerung {
  typ: "MIETSTEIGERUNG_OPTIMISTISCH";
  mietsteigerungProzentJaehrlich: number;
}

export type AnnahmenWarnung = AnnahmenWarnungLeerstand | AnnahmenWarnungWertsteigerung | AnnahmenWarnungMietsteigerung;

export interface AnnahmenWarnungenInput {
  leerstandsquoteProzent: number;
  wertsteigerungProzentJaehrlich: number;
  mietsteigerungProzentJaehrlich: number;
}

/**
 * Prüft die eigenen Annahmen (nicht die Objektdaten) auf typische
 * Selbsttäuschung: Werte, die für sich genommen gültig sind, aber über
 * lange Zeiträume das Ergebnis unrealistisch schönen. Anders als die
 * Verhandlungsargumente richten sich diese Hinweise an den Nutzer selbst,
 * nicht an ein Gespräch mit Verkäufer/Makler.
 */
export function ermittleAnnahmenWarnungen(input: AnnahmenWarnungenInput): AnnahmenWarnung[] {
  const warnungen: AnnahmenWarnung[] = [];

  if (input.leerstandsquoteProzent < LEERSTAND_UNREALISTISCH_SCHWELLE_PROZENT) {
    warnungen.push({ typ: "LEERSTAND_UNREALISTISCH", leerstandsquoteProzent: input.leerstandsquoteProzent });
  }

  if (input.wertsteigerungProzentJaehrlich > WERTSTEIGERUNG_OPTIMISTISCH_SCHWELLE_PROZENT) {
    warnungen.push({
      typ: "WERTSTEIGERUNG_OPTIMISTISCH",
      wertsteigerungProzentJaehrlich: input.wertsteigerungProzentJaehrlich,
    });
  }

  if (input.mietsteigerungProzentJaehrlich > MIETSTEIGERUNG_OPTIMISTISCH_SCHWELLE_PROZENT) {
    warnungen.push({
      typ: "MIETSTEIGERUNG_OPTIMISTISCH",
      mietsteigerungProzentJaehrlich: input.mietsteigerungProzentJaehrlich,
    });
  }

  return warnungen;
}
