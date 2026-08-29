import { ladeProfil } from "@/server/actions/profile";
import { PROFIL_DEFAULT_WERTE, PROFIL_STEUER_DEFAULT_WERTE } from "@/server/data/mappers";
import { Card, CardTitle } from "@/components/ui/Card";
import { ProfileForm } from "./ProfileForm";
import { ExportButton } from "./ExportButton";
import { RestoreButton } from "./RestoreButton";

// Liest live aus der DB — nicht build-zeitig statisch prerendern (die DB ist
// beim `next build` in Docker nicht erreichbar, und der Stand wäre ohnehin
// sofort veraltet).
export const dynamic = "force-dynamic";

export const metadata = { title: "Profil" };

export default async function ProfilPage() {
  const profil = await ladeProfil();

  const initialValues = {
    nettoEinkommenMonatlich: profil?.nettoEinkommenMonatlich.toNumber() ?? PROFIL_DEFAULT_WERTE.nettoEinkommenMonatlich,
    bruttoEinkommenMonatlich: profil?.bruttoEinkommenMonatlich.toNumber() ?? PROFIL_DEFAULT_WERTE.bruttoEinkommenMonatlich,
    zuVersteuerndesEinkommenJaehrlich:
      profil?.zuVersteuerndesEinkommenJaehrlich.toNumber() ?? PROFIL_DEFAULT_WERTE.zuVersteuerndesEinkommenJaehrlich,
    zvEOverride: profil?.zvEOverride ?? PROFIL_DEFAULT_WERTE.zvEOverride,
    fixkostenMonatlich: profil?.fixkostenMonatlich.toNumber() ?? PROFIL_DEFAULT_WERTE.fixkostenMonatlich,
    vorhandenesEigenkapital: profil?.vorhandenesEigenkapital.toNumber() ?? PROFIL_DEFAULT_WERTE.vorhandenesEigenkapital,
    maxSchuldendienstquoteProzent:
      profil?.maxSchuldendienstquoteProzent.toNumber() ?? PROFIL_DEFAULT_WERTE.maxSchuldendienstquoteProzent,
    mindestLiquiditaetsreserveEuro:
      profil?.mindestLiquiditaetsreserveEuro.toNumber() ?? PROFIL_DEFAULT_WERTE.mindestLiquiditaetsreserveEuro,
    mietanrechnungProzent: profil?.mietanrechnungProzent.toNumber() ?? PROFIL_DEFAULT_WERTE.mietanrechnungProzent,
    mindestEigenkapitalrenditeProzent:
      profil?.mindestEigenkapitalrenditeProzent.toNumber() ?? PROFIL_DEFAULT_WERTE.mindestEigenkapitalrenditeProzent,
    eigenkapitalPruefungAbEuro: profil?.eigenkapitalPruefungAbEuro.toNumber() ?? PROFIL_DEFAULT_WERTE.eigenkapitalPruefungAbEuro,
    cashflowStartverlustMaxProzentKaltmiete:
      profil?.cashflowStartverlustMaxProzentKaltmiete.toNumber() ?? PROFIL_DEFAULT_WERTE.cashflowStartverlustMaxProzentKaltmiete,
    cashflowUmschlagjahr: profil?.cashflowUmschlagjahr ?? PROFIL_DEFAULT_WERTE.cashflowUmschlagjahr,
    bundesland: profil?.bundesland ?? PROFIL_STEUER_DEFAULT_WERTE.bundesland,
    kirchensteuerpflichtig: profil?.kirchensteuerpflichtig ?? PROFIL_STEUER_DEFAULT_WERTE.kirchensteuerpflichtig,
    beschaeftigungsstatus: profil?.beschaeftigungsstatus ?? PROFIL_STEUER_DEFAULT_WERTE.beschaeftigungsstatus,
    gesetzlichKrankenversichert: profil?.gesetzlichKrankenversichert ?? PROFIL_STEUER_DEFAULT_WERTE.gesetzlichKrankenversichert,
    kinderlos: profil?.kinderlos ?? PROFIL_STEUER_DEFAULT_WERTE.kinderlos,
    liabilities:
      profil?.liabilities.map((l) => ({
        id: l.id,
        bezeichnung: l.bezeichnung,
        monatlicheRate: l.monatlicheRate.toNumber(),
        restschuld: l.restschuld.toNumber(),
      })) ?? [],
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Profil</h1>
        <p className="mt-1 text-slate-400">
          Einmalig ausfüllen — wird bei jeder Objekt-Berechnung für Grenzsteuersatz und Finanzierbarkeit genutzt.
        </p>
      </div>
      <ProfileForm initialValues={initialValues} />

      <Card>
        <CardTitle>Daten-Backup</CardTitle>
        <p className="mb-4 text-sm text-slate-400">
          Lädt einen lesbaren JSON-Snapshot aller selbst eingegebenen Daten herunter (Objekte, Sparpositionen, Profil,
          Szenarien, Referenzdaten). Sinnvoll, weil es kein App-Login und keine Cloud-Synchronisation gibt — die
          einzige Persistenz ist das Docker-Volume.
        </p>
        <ExportButton />

        <hr className="my-4 border-slate-800" />

        <p className="mb-4 text-sm text-slate-400">
          Spielt ein zuvor heruntergeladenes Backup wieder ein — <strong>ersetzt dabei vollständig</strong> Objekte,
          Profil, Sparpositionen und Szenarien durch den Stand im Backup (Referenzdaten/Standardwerte bleiben
          unangetastet). Zeigt vor dem Ausführen eine Vorschau und verlangt eine Freitext-Bestätigung.
        </p>
        <RestoreButton />
      </Card>
    </div>
  );
}
