import type { Lagetyp } from "@/server/calc/types";

/**
 * Reine Aggregationslogik für scripts/import-bodenrichtwerte.ts: reduziert
 * rohe BORIS-SH-Zonenwerte auf einen Durchschnitt pro Lagetyp. Bewusst von
 * der eigentlichen Fetch-/Prisma-Logik getrennt (die lebt weiterhin im
 * Skript), damit sich die Aggregation ohne Netzwerk-/DB-Verbindung testen
 * lässt — insbesondere wichtig, solange der echte BORIS-SH-Zugriff noch
 * unverifiziert ist (siehe Kommentar im Skript).
 */
export interface RawBodenrichtwertRow {
  bodenrichtwertEuroProM2: number;
  /** Nutzungsart der Zone (z. B. "W" = Wohnbauland) — nur Wohnbauland fließt in den Vergleich ein. */
  nutzungsart: string;
  /**
   * Lagetyp-Klassifizierung der Zone. ACHTUNG: rohe BORIS-Zonendaten haben
   * KEIN Lagetyp-Feld — das ist Geometrie + Verwaltungszuordnung. Wie genau
   * eine Zone auf LAENDLICH/KLEINSTADT/GROSSSTADT abgebildet wird (z. B. über
   * Gemeinde-Einwohnerzahl), ist Teil dessen, was beim ersten echten Lauf
   * gegen die echte API geklärt werden muss.
   */
  lagetyp: Lagetyp;
}

export function aggregateToLagetyp(rows: RawBodenrichtwertRow[]): { lagetyp: Lagetyp; bodenrichtwertProM2: number }[] {
  const wohnbauland = rows.filter((r) => r.nutzungsart === "W");
  const lagetypen = Array.from(new Set(wohnbauland.map((r) => r.lagetyp)));

  return lagetypen.map((lagetyp) => {
    const werte = wohnbauland.filter((r) => r.lagetyp === lagetyp).map((r) => r.bodenrichtwertEuroProM2);
    const durchschnitt = werte.reduce((sum, w) => sum + w, 0) / werte.length;
    return { lagetyp, bodenrichtwertProM2: Math.round(durchschnitt * 100) / 100 };
  });
}
