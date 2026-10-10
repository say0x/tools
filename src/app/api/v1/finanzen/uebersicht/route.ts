import { apiRoute, jsonAntwort } from "@/server/api/handler";
import { eineStelle } from "@/server/api/dto";
import { ladeDashboardKennzahlen } from "@/server/data/dashboard-kennzahlen";

export const dynamic = "force-dynamic";

const euro = (n: number) => Math.round(n * 100) / 100;

/** Finanz-Kennzahlen des Start-Dashboards (dieselbe Quelle wie die Startseite). Beträge in Euro. */
export const GET = apiRoute({}, async (k) => {
  const f = await ladeDashboardKennzahlen(k.userId);
  return jsonAntwort({
    vermoegenReferenzEur: euro(f.gesamtvermoegenReferenz),
    vermoegenNettoEur: euro(f.gesamtvermoegenNetto),
    immobilienEigenkapitalReferenzEur: euro(f.immobilienEigenkapitalReferenz),
    bargeldUndDepotsEur: euro(f.sparvermoegen),
    tagesgeldEur: euro(f.tagesgeldImBesitz),
    restschuldenEur: euro(f.gesamtSchuldenRestschuld),
    fixkostenMonatlichEur: euro(f.fixkostenMonatlich),
    notgroschenMonate: f.notgroschenMonate == null ? null : eineStelle(f.notgroschenMonate),
    immobilien: {
      gesamt: f.objekteGesamt,
      imBesitz: f.objekteImBesitz,
      cashflowMonatlichEur: euro(f.monatlicherImmobilienCashflow),
      bruttorenditeSchnittProzent: f.durchschnittlicheBruttorendite == null ? null : eineStelle(f.durchschnittlicheBruttorendite),
      ampel: f.ampelVerteilung,
    },
    sparpositionen: { imBesitz: f.sparpositionenImBesitz, groesste: f.groessteSparposition },
    szenarien: f.szenarienAnzahl,
  });
});
