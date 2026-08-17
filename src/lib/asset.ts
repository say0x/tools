// Cross-tool foundation: der Besitzstatus gilt für JEDEN Asset-Typ (Immobilie,
// Wertpapier, Tagesgeld, künftig Fahrzeug/Kredit/...), nicht nur für ein
// einzelnes Tool. Deliberately decoupled from Prisma (plain string-literal
// union, Werte matchen den Prisma-Enum-Namen 1:1), analog zu den
// domain-spezifischen Unions in server/calc/types.ts.

export const BESITZSTAENDE = ["BESITZE_ICH", "POTENZIELLE_ANSCHAFFUNG", "SPEKULATION", "VERKAUFT", "ARCHIVIERT"] as const;
export type Besitzstatus = (typeof BESITZSTAENDE)[number];

/** Nur Assets mit diesem Status zählen automatisch im Vermögen (Finanzübersicht) mit. */
export const BESITZSTATUS_ZAEHLT_IM_VERMOEGEN: Besitzstatus = "BESITZE_ICH";

export const BESITZSTATUS_LABELS: Record<Besitzstatus, string> = {
  BESITZE_ICH: "Besitze ich",
  POTENZIELLE_ANSCHAFFUNG: "Potenzielle Anschaffung",
  SPEKULATION: "Spekulation",
  VERKAUFT: "Verkauft",
  ARCHIVIERT: "Archiviert",
};

export const BESITZSTATUS_HILFE: Record<Besitzstatus, string> = {
  BESITZE_ICH: "Gehört tatsächlich zu deinem Vermögen — zählt automatisch in der Finanzübersicht mit.",
  POTENZIELLE_ANSCHAFFUNG: "Noch nicht gekauft/eingerichtet, aber konkret geplant. Zählt nicht im aktuellen Vermögen, lässt sich aber in Szenarien einbeziehen.",
  SPEKULATION: "Rein hypothetische Kalkulation (\"lohnt sich das überhaupt?\"), ohne konkreten Kaufplan. Zählt nicht im Vermögen.",
  VERKAUFT: "Ehemals besessen, mittlerweile veräußert. Bleibt für Historie/Auswertung erhalten, zählt nicht mehr im aktuellen Vermögen.",
  ARCHIVIERT: "Nicht mehr aktiv relevant, aber nicht gelöscht (z. B. alte Kalkulation). Zählt nicht im Vermögen.",
};
