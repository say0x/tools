import { KreditvergleichClient } from "./KreditvergleichClient";

export const metadata = { title: "Kreditvergleich" };

export default function KreditvergleichPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Kreditvergleich</h1>
        <p className="mt-1 text-slate-400">
          Zwei Finanzierungsangebote nebeneinander durchrechnen — unabhängig von einem konkreten Objekt. Rein hypothetisch,
          speichert nichts.
        </p>
      </div>
      <KreditvergleichClient />
    </div>
  );
}
