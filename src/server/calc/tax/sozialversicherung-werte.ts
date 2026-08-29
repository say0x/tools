// Beitragssätze und Beitragsbemessungsgrenzen der Sozialversicherung, Jahr für
// Jahr gepflegt (analog zu estg-zonen.ts/soli-werte.ts). Nur Arbeitnehmer-
// Anteile — die Arbeitgeber-Anteile fließen nirgends in diesen Rechner ein.
//
// WICHTIG: Werte vor produktivem Einsatz gegen die aktuelle Rechengrößen-
// Verordnung verifizieren — Jahre ohne Eintrag fallen auf das jüngste bekannte
// Jahr zurück (siehe sozialabgaben.ts), was für eine grobe Näherung reicht,
// aber keine Beitragsberechnung im Rechtssinn ersetzt.

export interface SozialversicherungWerte {
  /** Renten-/Arbeitslosenversicherung: gemeinsame Beitragsbemessungsgrenze, €/Jahr. */
  bbgRentenArbeitslosenversicherungJaehrlich: number;
  /** Kranken-/Pflegeversicherung: gemeinsame Beitragsbemessungsgrenze, €/Jahr. */
  bbgKrankenPflegeversicherungJaehrlich: number;
  rentenversicherungArbeitnehmerProzent: number;
  arbeitslosenversicherungArbeitnehmerProzent: number;
  /** Krankenversicherung: Basisbeitrag (Arbeitnehmeranteil), ohne Zusatzbeitrag. */
  krankenversicherungBasisArbeitnehmerProzent: number;
  /** Durchschnittlicher Zusatzbeitrag der Kassen, hälftig vom Arbeitnehmer getragen — bereits als AN-Anteil. */
  krankenversicherungZusatzbeitragArbeitnehmerProzent: number;
  /** Pflegeversicherung gesamt (Arbeitgeber+Arbeitnehmer), mit Kindern. */
  pflegeversicherungGesamtProzent: number;
  /** Zuschlag für Kinderlose ab 23 Jahre, zusätzlich zum Gesamtsatz, voll vom Arbeitnehmer getragen. */
  pflegeversicherungKinderlosenzuschlagProzent: number;
  /** Arbeitgeber-Anteil Pflegeversicherung — bundesweit einheitlich, außer Sachsen (siehe sozialabgaben.ts). */
  pflegeversicherungArbeitgeberProzent: number;
  /** Arbeitgeber-Anteil Pflegeversicherung in Sachsen (Ausgleich für den zusätzlichen Feiertag Buß- und Bettag). */
  pflegeversicherungArbeitgeberProzentSachsen: number;
}

export const SOZIALVERSICHERUNG_WERTE: Record<number, SozialversicherungWerte> = {
  2025: {
    bbgRentenArbeitslosenversicherungJaehrlich: 96600,
    bbgKrankenPflegeversicherungJaehrlich: 66150,
    rentenversicherungArbeitnehmerProzent: 9.3,
    arbeitslosenversicherungArbeitnehmerProzent: 1.3,
    krankenversicherungBasisArbeitnehmerProzent: 7.3,
    krankenversicherungZusatzbeitragArbeitnehmerProzent: 1.25,
    pflegeversicherungGesamtProzent: 3.6,
    pflegeversicherungKinderlosenzuschlagProzent: 0.6,
    pflegeversicherungArbeitgeberProzent: 1.7,
    pflegeversicherungArbeitgeberProzentSachsen: 1.3,
  },
  2026: {
    bbgRentenArbeitslosenversicherungJaehrlich: 101400,
    bbgKrankenPflegeversicherungJaehrlich: 69750,
    rentenversicherungArbeitnehmerProzent: 9.3,
    arbeitslosenversicherungArbeitnehmerProzent: 1.3,
    krankenversicherungBasisArbeitnehmerProzent: 7.3,
    krankenversicherungZusatzbeitragArbeitnehmerProzent: 1.45,
    pflegeversicherungGesamtProzent: 3.6,
    pflegeversicherungKinderlosenzuschlagProzent: 0.6,
    pflegeversicherungArbeitgeberProzent: 1.7,
    pflegeversicherungArbeitgeberProzentSachsen: 1.3,
  },
};

export function resolveSozialversicherungWerte(jahr: number): { jahr: number; werte: SozialversicherungWerte } {
  if (SOZIALVERSICHERUNG_WERTE[jahr]) return { jahr, werte: SOZIALVERSICHERUNG_WERTE[jahr] };
  const jahre = Object.keys(SOZIALVERSICHERUNG_WERTE).map(Number).sort((a, b) => a - b);
  const naechstes = jahre.filter((j) => j <= jahr).pop() ?? jahre[jahre.length - 1];
  return { jahr: naechstes, werte: SOZIALVERSICHERUNG_WERTE[naechstes] };
}
