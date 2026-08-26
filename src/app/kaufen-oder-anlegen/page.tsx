import { berechneObjekt } from "@/server/calc/engine";
import { ladeProfil } from "@/server/actions/profile";
import { ladeSparpositionen } from "@/server/actions/finanzuebersicht";
import { ladeObjekte } from "@/server/data/property";
import { ladeReferenceDataSnapshot } from "@/server/data/reference-data";
import { toProfileInput, toPropertyInput } from "@/server/data/mappers";
import { KaufenOderAnlegenClient } from "./KaufenOderAnlegenClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "Kaufen oder Anlegen?" };

export default async function KaufenOderAnlegenPage() {
  const [propertyRows, profilRow, referenceData, sparpositionenRows] = await Promise.all([
    ladeObjekte(),
    ladeProfil(),
    ladeReferenceDataSnapshot(),
    ladeSparpositionen(),
  ]);

  const profile = toProfileInput(profilRow);

  // Vorschlag für die Alternativanlage-Rendite aus den echten, bereits besessenen
  // Wertpapierdepots ableiten, statt einen Schätzwert neu eintippen zu lassen (der
  // Nutzer hat die Annahme für diese Depots schon in der Finanzübersicht hinterlegt).
  const besesseneWertpapiere = sparpositionenRows.wertpapiere.filter((w) => w.asset.besitzstatus === "BESITZE_ICH");
  const renditeVorschlagProzent =
    besesseneWertpapiere.length > 0
      ? Math.round(
          (besesseneWertpapiere.reduce((summe, w) => summe + w.renditeProzentJaehrlich, 0) / besesseneWertpapiere.length) * 10
        ) / 10
      : null;

  // "Kaufen oder Anlegen?" rechnet den Eigenkapital-Einsatz "beim Kauf" gegen eine
  // Alternativanlage durch — eine noch sinnvolle Frage für besessene, potenzielle
  // oder rein spekulative Objekte, aber nicht für längst verkaufte/archivierte:
  // berechneObjekt() würde deren alte Finanzierungsdaten mit dem heutigen Profil/
  // Steuerjahr durchrechnen, als stünde der Kauf noch bevor — weder eine echte
  // Rückschau noch eine sinnvolle Kaufentscheidung. Siehe SzenarioClient.tsx für
  // dasselbe bereits behobene Muster bei "Immobilie aufnehmen".
  const objekteZurAuswahl = propertyRows.filter(
    (row) => row.asset.besitzstatus !== "VERKAUFT" && row.asset.besitzstatus !== "ARCHIVIERT"
  );

  const objekte = objekteZurAuswahl.map((row) => {
    const result = berechneObjekt(toPropertyInput(row), profile, referenceData);
    return {
      id: row.id,
      name: row.asset.name,
      eigenkapitalEinsatzEuro: result.finanzierung.eigenkapitalEinsatzEuro,
      vermoegensverlauf: result.vermoegensverlauf.map((j) => ({
        jahr: j.jahr,
        eigenkapitalanteil: j.eigenkapitalanteil,
        kumulierterCashflowNachSteuer: j.kumulierterCashflowNachSteuer,
      })),
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Kaufen oder Anlegen?</h1>
        <p className="mt-1 text-slate-400">
          Vergleicht ein Objekt aus deiner Bibliothek gegen die Alternative, dasselbe Eigenkapital stattdessen in ein
          Wertpapierdepot zu stecken — wo stehst du nach X Jahren besser da?
        </p>
      </div>
      {objekte.length === 0 ? (
        <p className="text-sm text-slate-400">
          Noch keine Objekte in der Bibliothek — lege zuerst eins im Immobilien-Rechner an.
        </p>
      ) : (
        <KaufenOderAnlegenClient objekte={objekte} renditeVorschlagProzent={renditeVorschlagProzent} />
      )}
    </div>
  );
}
