export const BUNDESLAND_LABELS: Record<string, string> = {
  BADEN_WUERTTEMBERG: "Baden-Württemberg",
  BAYERN: "Bayern",
  BERLIN: "Berlin",
  BRANDENBURG: "Brandenburg",
  BREMEN: "Bremen",
  HAMBURG: "Hamburg",
  HESSEN: "Hessen",
  MECKLENBURG_VORPOMMERN: "Mecklenburg-Vorpommern",
  NIEDERSACHSEN: "Niedersachsen",
  NORDRHEIN_WESTFALEN: "Nordrhein-Westfalen",
  RHEINLAND_PFALZ: "Rheinland-Pfalz",
  SAARLAND: "Saarland",
  SACHSEN: "Sachsen",
  SACHSEN_ANHALT: "Sachsen-Anhalt",
  SCHLESWIG_HOLSTEIN: "Schleswig-Holstein",
  THUERINGEN: "Thüringen",
};

export const LAGETYP_LABELS: Record<string, string> = {
  LAENDLICH: "Ländlich",
  KLEINSTADT: "Kleinstadt",
  GROSSSTADT: "Großstadt",
};

export const OBJEKTTYP_LABELS: Record<string, string> = {
  ETW: "Eigentumswohnung",
  MEHRFAMILIENHAUS: "Mehrfamilienhaus",
  HAUS: "Haus",
};

export const FINANZIERUNGSART_LABELS: Record<string, string> = {
  FINANZIERUNG_100: "100 % — Bank finanziert Kaufpreis",
  FINANZIERUNG_110: "110 % — Bank finanziert Kaufpreis + Nebenkosten",
  MANUELL: "Manuell — eigene EK-Quote",
};

export const GEWERK_LABELS: Record<string, string> = {
  DACH: "Dach",
  FENSTER: "Fenster",
  HEIZUNG: "Heizung",
  ELEKTRIK: "Elektrik",
  SANITAER_BAEDER: "Sanitär / Bäder",
  MAUERWERK_FASSADE: "Mauerwerk / Fassade",
  BODENBELAEGE: "Bodenbeläge",
  SONSTIGES: "Sonstiges",
};

export const EIGENTUMSTYP_LABELS: Record<string, string> = {
  SONDEREIGENTUM: "Sondereigentum",
  GEMEINSCHAFTSEIGENTUM: "Gemeinschaftseigentum (WEG)",
};

export const SANIERUNGSMODUS_LABELS: Record<string, string> = {
  PAUSCHAL: "Pauschal",
  GRANULAR: "Granular (je Gewerk)",
};

export const ZUSTAND_LABELS: Record<number, string> = {
  1: "1 — sehr gut",
  2: "2 — gut",
  3: "3 — mittel",
  4: "4 — mäßig",
  5: "5 — schlecht",
  6: "6 — sehr schlecht",
};

export const VERGLASUNG_LABELS: Record<string, string> = {
  EINFACH: "Einfachverglasung",
  DOPPEL: "Doppelverglasung (Standard)",
  DREIFACH: "Dreifachverglasung",
};

export const AMPEL_LABELS: Record<string, string> = {
  GRUEN: "Grün",
  GELB: "Gelb",
  ROT: "Rot",
};

export const SPARPOSITION_ART_LABELS: Record<string, string> = {
  WERTPAPIERDEPOT: "Wertpapierdepot (Aktien/ETF)",
  TAGESGELD: "Tagesgeld",
};

export const SZENARIO_AENDERUNG_TYP_LABELS: Record<string, string> = {
  IMMOBILIE_AUFNEHMEN: "Immobilie kaufen",
  IMMOBILIE_VERKAUFEN: "Immobilie verkaufen",
  SPARRATE_AENDERN: "Sparrate ändern",
  EINMALIGE_ANSCHAFFUNG: "Einmalige Anschaffung",
  IMMOBILIE_STATT_ALTERNATIVANLAGE: "Immobilie kaufen (statt Alternativanlage)",
};

export const SZENARIO_AENDERUNG_TYP_HILFE: Record<string, string> = {
  IMMOBILIE_AUFNEHMEN:
    "Eine vorhandene Immobilie mit Status „Potenzielle Anschaffung“ oder „Spekulation“ wird in diesem Szenario ab ihrem Kaufdatum so behandelt, als hättest du sie gekauft.",
  IMMOBILIE_VERKAUFEN:
    "Eine Immobilie, die du tatsächlich besitzt, wird in diesem Szenario zu einem gewählten Jahr verkauft — ihr Cashflow endet, der heutige Marktwert (Referenz) fließt einmalig als Verkaufserlös zu.",
  SPARRATE_AENDERN: "Die monatliche Sparrate einer vorhandenen Wertpapier-/Tagesgeld-Position ändert sich ab dem Startjahr des Szenarios.",
  EINMALIGE_ANSCHAFFUNG:
    "Eine frei benannte einmalige Ausgabe (z. B. ein Auto) zu einem gewählten Jahr — reduziert das verfügbare Geld einmalig, ohne dass dafür ein eigenes Objekt angelegt werden muss.",
  IMMOBILIE_STATT_ALTERNATIVANLAGE:
    "Wie „Immobilie kaufen“, rechnet aber zusätzlich den Opportunitätskosten-Vergleich mit ein: das beim Kauf eingesetzte Eigenkapital wird gedanklich ab heute (nicht erst ab dem Kaufdatum) zur gewählten Rendite in eine Alternativanlage gesteckt — nur der dadurch entgangene Gewinn wird vom Immobilien-Cashflow abgezogen.",
};
