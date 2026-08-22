import { SteuerrechnerClient } from "./SteuerrechnerClient";

export const metadata = { title: "Steuerrechner" };

export default function SteuerrechnerPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Steuerrechner</h1>
        <p className="mt-1 text-slate-400">
          Freistehender Grenzsteuersatz-Rechner: unabhängig vom hinterlegten Profil schnell durchspielen, wie sich ein anderes
          Einkommen auf Steuerlast und Grenzsteuersatz auswirkt. Rein hypothetisch — speichert nichts.
        </p>
      </div>
      <SteuerrechnerClient />
    </div>
  );
}
