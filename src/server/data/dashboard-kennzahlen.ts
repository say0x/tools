import { prisma } from "@/server/db";
import { berechneObjekt } from "@/server/calc/engine";
import type { CalculationResult } from "@/server/calc/types";
import { BESITZSTATUS_ZAEHLT_IM_VERMOEGEN } from "@/lib/asset";
import { toProfileInput, toPropertyInput, type PropertyWithAsset } from "./mappers";
import { ladeObjekteFuerUser } from "./property";
import { ladeReferenceDataSnapshot } from "./reference-data";
import { immobilienPositionAusErgebnis } from "./vermoegen";

/**
 * Finanz-Kennzahlen des Start-Dashboards für einen User — eine Quelle für die
 * Startseite UND die REST-API/Home-Assistant-Sensoren, damit beide nie
 * auseinanderlaufen. userId explizit (kein Cookie), siehe docs/api/README.md.
 *
 * Referenz (Dashboard-Kennzahlen, Notgroschen-Reichweite): docs/tools/weitere-rechner.md
 */

type Ampel = "GRUEN" | "GELB" | "ROT";

export interface DashboardKennzahlen {
  objekteGesamt: number;
  objekteImBesitz: number;
  monatlicherImmobilienCashflow: number;
  ampelVerteilung: Record<Ampel, number>;
  durchschnittlicheBruttorendite: number | null;
  sparvermoegen: number;
  sparpositionenImBesitz: number;
  groessteSparposition: { name: string; betrag: number } | null;
  tagesgeldImBesitz: number;
  fixkostenMonatlich: number;
  notgroschenMonate: number | null;
  keinProfilHinterlegt: boolean;
  immobilienEigenkapitalReferenz: number;
  gesamtvermoegenReferenz: number;
  gesamtSchuldenRestschuld: number;
  gesamtvermoegenNetto: number;
  szenarienAnzahl: number;
  nochKeineDaten: boolean;
  /** Je Objekt berechnetes Engine-Ergebnis — für Aufrufer, die weitere Kennzahlen brauchen. */
  objekteMitErgebnis: { row: PropertyWithAsset; result: CalculationResult }[];
}

export async function ladeDashboardKennzahlen(userId: string, heute: Date = new Date()): Promise<DashboardKennzahlen> {
  const [propertyRows, profilRow, referenceData, wertpapiere, tagesgeld, szenarienAnzahl] = await Promise.all([
    ladeObjekteFuerUser(userId),
    prisma.userProfile.findFirst({ where: { userId }, include: { liabilities: true } }),
    ladeReferenceDataSnapshot(),
    prisma.wertpapierposition.findMany({ where: { asset: { userId } }, include: { asset: true }, orderBy: { createdAt: "asc" } }),
    prisma.tagesgeldkonto.findMany({ where: { asset: { userId } }, include: { asset: true }, orderBy: { createdAt: "asc" } }),
    prisma.szenario.count({ where: { userId } }),
  ]);

  const profile = toProfileInput(profilRow);

  // Einmal pro Objekt berechnen und für Ampel/Cashflow sowie die Vermögens-Referenzwerte
  // wiederverwenden, statt die 50-Jahres-Engine-Berechnung zweimal anzustoßen.
  const objekteMitErgebnis = propertyRows.map((row) => ({ row, result: berechneObjekt(toPropertyInput(row), profile, referenceData) }));
  const imBesitz = objekteMitErgebnis.filter(({ row }) => row.asset.besitzstatus === BESITZSTATUS_ZAEHLT_IM_VERMOEGEN).map(({ result }) => result);

  const monatlicherImmobilienCashflow = imBesitz.reduce((s, r) => s + r.rendite.monatlicherCashflowNachSteuer, 0);
  const ampelVerteilung: Record<Ampel, number> = { GRUEN: 0, GELB: 0, ROT: 0 };
  for (const o of imBesitz) ampelVerteilung[o.affordability.ampel]++;
  const durchschnittlicheBruttorendite =
    imBesitz.length === 0 ? null : imBesitz.reduce((s, r) => s + r.rendite.bruttomietrenditeProzent, 0) / imBesitz.length;

  const sparpositionen = [...wertpapiere, ...tagesgeld].filter((p) => p.asset.besitzstatus === BESITZSTATUS_ZAEHLT_IM_VERMOEGEN);
  const sparvermoegen = sparpositionen.reduce((s, p) => s + p.betrag.toNumber(), 0);
  // Notgroschen bewusst nur aus Tagesgeld (sofort verfügbar) — Depots müssten erst verkauft werden.
  const tagesgeldImBesitz = tagesgeld
    .filter((t) => t.asset.besitzstatus === BESITZSTATUS_ZAEHLT_IM_VERMOEGEN)
    .reduce((s, t) => s + t.betrag.toNumber(), 0);
  const fixkostenMonatlich = profilRow?.fixkostenMonatlich.toNumber() ?? 0;
  const groesste = sparpositionen.reduce<(typeof sparpositionen)[number] | null>(
    (g, p) => (g === null || p.betrag.toNumber() > g.betrag.toNumber() ? p : g),
    null
  );

  const immobilienEigenkapitalReferenz = objekteMitErgebnis
    .map(({ row, result }) => immobilienPositionAusErgebnis(row, result, heute))
    .filter((p) => p.besitzstatus === BESITZSTATUS_ZAEHLT_IM_VERMOEGEN)
    .reduce((s, p) => s + p.eigenkapitalanteilHeuteReferenz, 0);
  const gesamtvermoegenReferenz = immobilienEigenkapitalReferenz + sparvermoegen;
  // Bestehende Kredite fließen bewusst in keine andere Kennzahl ein (docs/tools/weitere-rechner.md) —
  // hier als einzige Stelle von der Referenzgröße abgezogen.
  const gesamtSchuldenRestschuld = profile.liabilities.reduce((s, l) => s + l.restschuld, 0);

  return {
    objekteGesamt: propertyRows.length,
    objekteImBesitz: imBesitz.length,
    monatlicherImmobilienCashflow,
    ampelVerteilung,
    durchschnittlicheBruttorendite,
    sparvermoegen,
    sparpositionenImBesitz: sparpositionen.length,
    groessteSparposition: groesste ? { name: groesste.asset.name, betrag: groesste.betrag.toNumber() } : null,
    tagesgeldImBesitz,
    fixkostenMonatlich,
    notgroschenMonate: fixkostenMonatlich > 0 ? tagesgeldImBesitz / fixkostenMonatlich : null,
    keinProfilHinterlegt: !profilRow || fixkostenMonatlich === 0,
    immobilienEigenkapitalReferenz,
    gesamtvermoegenReferenz,
    gesamtSchuldenRestschuld,
    gesamtvermoegenNetto: gesamtvermoegenReferenz - gesamtSchuldenRestschuld,
    szenarienAnzahl,
    nochKeineDaten: propertyRows.length === 0 && wertpapiere.length === 0 && tagesgeld.length === 0,
    objekteMitErgebnis,
  };
}
