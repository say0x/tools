import { ladeProfil } from "@/server/actions/profile";
import { PROFIL_STEUER_DEFAULT_WERTE } from "@/server/data/mappers";
import { SteuerrechnerClient } from "./SteuerrechnerClient";

// Liest live aus der DB (Steuerliche Angaben aus dem Profil als Vorbelegung)
// — nicht build-zeitig statisch prerendern (die DB ist beim `next build` in
// Docker nicht erreichbar).
export const dynamic = "force-dynamic";

export const metadata = { title: "Steuerrechner" };

export default async function SteuerrechnerPage() {
  const profil = await ladeProfil();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Steuerrechner</h1>
        <p className="mt-1 text-slate-400">
          Freistehender Grenzsteuersatz-Rechner: unabhängig vom hinterlegten Profil schnell durchspielen, wie sich ein anderes
          Einkommen auf Steuerlast und Grenzsteuersatz auswirkt. Rein hypothetisch — speichert nichts. Bundesland, Kirchensteuer- und
          Sozialversicherungs-Angaben sind aus dem Profil vorbelegt, aber hier ebenfalls frei änderbar.
        </p>
      </div>
      <SteuerrechnerClient
        bundeslandInitial={profil?.bundesland ?? PROFIL_STEUER_DEFAULT_WERTE.bundesland}
        kirchensteuerpflichtigInitial={profil?.kirchensteuerpflichtig ?? PROFIL_STEUER_DEFAULT_WERTE.kirchensteuerpflichtig}
        beschaeftigungsstatusInitial={profil?.beschaeftigungsstatus ?? PROFIL_STEUER_DEFAULT_WERTE.beschaeftigungsstatus}
        gesetzlichKrankenversichertInitial={profil?.gesetzlichKrankenversichert ?? PROFIL_STEUER_DEFAULT_WERTE.gesetzlichKrankenversichert}
        kinderlosInitial={profil?.kinderlos ?? PROFIL_STEUER_DEFAULT_WERTE.kinderlos}
      />
    </div>
  );
}
