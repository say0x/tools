import { ladeProfil } from "@/server/actions/profile";
import { ProfileForm } from "./ProfileForm";

// Liest live aus der DB — nicht build-zeitig statisch prerendern (die DB ist
// beim `next build` in Docker nicht erreichbar, und der Stand wäre ohnehin
// sofort veraltet).
export const dynamic = "force-dynamic";

export const metadata = { title: "Profil" };

export default async function ProfilPage() {
  const profil = await ladeProfil();

  const initialValues = {
    nettoEinkommenMonatlich: profil?.nettoEinkommenMonatlich ?? 0,
    bruttoEinkommenMonatlich: profil?.bruttoEinkommenMonatlich ?? 0,
    zuVersteuerndesEinkommenJaehrlich: profil?.zuVersteuerndesEinkommenJaehrlich ?? 0,
    zvEOverride: profil?.zvEOverride ?? false,
    fixkostenMonatlich: profil?.fixkostenMonatlich ?? 0,
    vorhandenesEigenkapital: profil?.vorhandenesEigenkapital ?? 0,
    maxSchuldendienstquoteProzent: profil?.maxSchuldendienstquoteProzent ?? 35,
    mindestLiquiditaetsreserveEuro: profil?.mindestLiquiditaetsreserveEuro ?? 10000,
    mietanrechnungProzent: profil?.mietanrechnungProzent ?? 80,
    mindestEigenkapitalrenditeProzent: profil?.mindestEigenkapitalrenditeProzent ?? 4,
    eigenkapitalPruefungAbEuro: profil?.eigenkapitalPruefungAbEuro ?? 5000,
    liabilities:
      profil?.liabilities.map((l) => ({
        bezeichnung: l.bezeichnung,
        monatlicheRate: l.monatlicheRate,
        restschuld: l.restschuld,
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
    </div>
  );
}
