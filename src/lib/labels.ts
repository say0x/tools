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

export const AMPEL_LABELS: Record<string, string> = {
  GRUEN: "Grün",
  GELB: "Gelb",
  ROT: "Rot",
};
