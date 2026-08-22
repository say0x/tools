import { berechneObjekt } from "@/server/calc/engine";
import { ladeProfil } from "@/server/actions/profile";
import { ladeObjekte } from "@/server/data/property";
import { ladeReferenceDataSnapshot } from "@/server/data/reference-data";
import { toProfileInput, toPropertyInput } from "@/server/data/mappers";
import { KaufenOderAnlegenClient } from "./KaufenOderAnlegenClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "Kaufen oder Anlegen?" };

export default async function KaufenOderAnlegenPage() {
  const [propertyRows, profilRow, referenceData] = await Promise.all([
    ladeObjekte(),
    ladeProfil(),
    ladeReferenceDataSnapshot(),
  ]);

  const profile = toProfileInput(profilRow);

  const objekte = propertyRows.map((row) => {
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
        <KaufenOderAnlegenClient objekte={objekte} />
      )}
    </div>
  );
}
