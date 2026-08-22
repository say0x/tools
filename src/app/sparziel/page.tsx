import { SparzielClient } from "./SparzielClient";

export const metadata = { title: "Sparziel-Rechner" };

export default function SparzielPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Sparziel-Rechner</h1>
        <p className="mt-1 text-slate-400">
          Freistehender Zinseszins-Rechner: wie viel Kapital ergibt eine Sparrate über Zeit, und wann ist ein Zielbetrag erreicht?
          Rein hypothetisch — speichert nichts und wirkt sich nicht auf Finanzübersicht oder Szenarien aus.
        </p>
      </div>
      <SparzielClient />
    </div>
  );
}
