import type { Bundesland } from "../types";
import { resolveSozialversicherungWerte } from "./sozialversicherung-werte";

export interface SozialabgabenOptionen {
  beschaeftigungsstatus: "ANGESTELLT" | "SELBSTSTAENDIG";
  /** Nur relevant bei ANGESTELLT — privat Versicherte zahlen individuelle Prämien, hier nicht modelliert. */
  gesetzlichKrankenversichert: boolean;
  /** Kinderlosenzuschlag zur Pflegeversicherung, ab 23 Jahre. */
  kinderlos: boolean;
  bundesland: Bundesland;
}

export interface SozialabgabenErgebnis {
  rentenversicherung: number;
  arbeitslosenversicherung: number;
  krankenversicherung: number;
  pflegeversicherung: number;
  summe: number;
}

const LEER: SozialabgabenErgebnis = { rentenversicherung: 0, arbeitslosenversicherung: 0, krankenversicherung: 0, pflegeversicherung: 0, summe: 0 };

/**
 * Arbeitnehmer-Anteil der Sozialabgaben auf das Brutto-Jahreseinkommen
 * (nicht das zvE — Sozialabgaben kennen keine Werbungskosten-/
 * Sonderausgaben-Pauschale), jeweils gedeckelt auf die Beitragsbemessungsgrenze.
 *
 * Selbstständige zahlen keine automatischen Pflichtbeiträge (freiwillige
 * Beiträge variieren zu stark, um sie generisch abzubilden) — Ergebnis 0.
 * Privat Krankenversicherte zahlen individuelle Prämien statt eines
 * gesetzlichen Prozentsatzes — Kranken-/Pflegeversicherung bleiben dann 0,
 * Renten-/Arbeitslosenversicherung sind davon unabhängig und zählen weiter.
 */
export function berechneSozialabgaben(bruttoJaehrlich: number, jahr: number, optionen: SozialabgabenOptionen): SozialabgabenErgebnis {
  if (optionen.beschaeftigungsstatus === "SELBSTSTAENDIG") return LEER;

  const { werte } = resolveSozialversicherungWerte(jahr);

  const bemessungRvAlv = Math.min(bruttoJaehrlich, werte.bbgRentenArbeitslosenversicherungJaehrlich);
  const rentenversicherung = round2((bemessungRvAlv * werte.rentenversicherungArbeitnehmerProzent) / 100);
  const arbeitslosenversicherung = round2((bemessungRvAlv * werte.arbeitslosenversicherungArbeitnehmerProzent) / 100);

  let krankenversicherung = 0;
  let pflegeversicherung = 0;
  if (optionen.gesetzlichKrankenversichert) {
    const bemessungKvPv = Math.min(bruttoJaehrlich, werte.bbgKrankenPflegeversicherungJaehrlich);

    const kvProzent = werte.krankenversicherungBasisArbeitnehmerProzent + werte.krankenversicherungZusatzbeitragArbeitnehmerProzent;
    krankenversicherung = round2((bemessungKvPv * kvProzent) / 100);

    // Sachsen: Arbeitgeber trägt weniger (Ausgleich für den zusätzlichen
    // Feiertag Buß- und Bettag), Arbeitnehmer entsprechend mehr.
    const arbeitgeberProzent =
      optionen.bundesland === "SACHSEN" ? werte.pflegeversicherungArbeitgeberProzentSachsen : werte.pflegeversicherungArbeitgeberProzent;
    const gesamtProzent = werte.pflegeversicherungGesamtProzent + (optionen.kinderlos ? werte.pflegeversicherungKinderlosenzuschlagProzent : 0);
    const arbeitnehmerProzent = gesamtProzent - arbeitgeberProzent;
    pflegeversicherung = round2((bemessungKvPv * arbeitnehmerProzent) / 100);
  }

  return {
    rentenversicherung,
    arbeitslosenversicherung,
    krankenversicherung,
    pflegeversicherung,
    summe: round2(rentenversicherung + arbeitslosenversicherung + krankenversicherung + pflegeversicherung),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
