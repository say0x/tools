/**
 * Reine Entscheidungslogik für scripts/import-objekte.ts: welches Kriterium
 * identifiziert einen bereits importierten Eintrag? Bewusst von der
 * eigentlichen Prisma-Abfrage getrennt (die lebt weiterhin im Skript), damit
 * sich die Auswahl-Logik ohne DB-Verbindung testen lässt.
 */
export function ermittleDedupKriterium(roh: Record<string, unknown>): { quelleUrl: string } | { name: string } {
  const quelleUrl = typeof roh.quelleUrl === "string" ? roh.quelleUrl : "";
  if (quelleUrl) return { quelleUrl };
  return { name: String(roh.name ?? "(ohne Namen)") };
}
