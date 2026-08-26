"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/server/db";
import { profileSchema, type ProfileFormValues } from "./profile-schema";

export type { ProfileFormValues } from "./profile-schema";

export async function ladeProfil() {
  return prisma.userProfile.findFirst({ include: { liabilities: true } });
}

export async function upsertProfile(values: ProfileFormValues) {
  const result = profileSchema.safeParse(values);
  if (!result.success) {
    const meldung = result.error.issues.map((issue) => issue.message).join(" · ");
    throw new Error(`Ungültige Eingabe: ${meldung}`);
  }
  const data = result.data;

  const bestehend = await prisma.userProfile.findFirst();

  const profileData = {
    nettoEinkommenMonatlich: data.nettoEinkommenMonatlich,
    bruttoEinkommenMonatlich: data.bruttoEinkommenMonatlich,
    zuVersteuerndesEinkommenJaehrlich: data.zuVersteuerndesEinkommenJaehrlich,
    zvEOverride: data.zvEOverride,
    fixkostenMonatlich: data.fixkostenMonatlich,
    vorhandenesEigenkapital: data.vorhandenesEigenkapital,
    maxSchuldendienstquoteProzent: data.maxSchuldendienstquoteProzent,
    mindestLiquiditaetsreserveEuro: data.mindestLiquiditaetsreserveEuro,
    mietanrechnungProzent: data.mietanrechnungProzent,
    mindestEigenkapitalrenditeProzent: data.mindestEigenkapitalrenditeProzent,
    eigenkapitalPruefungAbEuro: data.eigenkapitalPruefungAbEuro,
    cashflowStartverlustMaxProzentKaltmiete: data.cashflowStartverlustMaxProzentKaltmiete,
    cashflowUmschlagjahr: data.cashflowUmschlagjahr,
  };

  await prisma.$transaction(async (tx) => {
    const profile = bestehend
      ? await tx.userProfile.update({ where: { id: bestehend.id }, data: profileData })
      : await tx.userProfile.create({ data: profileData });

    // Diffing per id statt Löschen+Neuanlegen aller Kredite bei jedem Speichern
    // (das Muster, das bei den Sparpositionen der Finanzübersicht schon einmal
    // zu kaskadierendem Datenverlust führte, siehe finanzuebersicht.ts) — auch
    // wenn UserLiability.id aktuell von nichts referenziert wird, unnötig neue
    // IDs bei jedem Speichern zu erzeugen ist kein Verhalten, das man bewusst
    // beibehalten will.
    const bestehendeIds = new Set(
      (await tx.userLiability.findMany({ where: { profileId: profile.id }, select: { id: true } })).map((l) => l.id)
    );
    const uebernommeneIds = new Set<string>();

    for (const l of data.liabilities) {
      const liabilityData = { bezeichnung: l.bezeichnung, monatlicheRate: l.monatlicheRate, restschuld: l.restschuld };
      if (l.id && bestehendeIds.has(l.id)) {
        uebernommeneIds.add(l.id);
        await tx.userLiability.update({ where: { id: l.id }, data: liabilityData });
      } else {
        await tx.userLiability.create({ data: { ...liabilityData, profileId: profile.id } });
      }
    }

    const zuLoeschendeIds = [...bestehendeIds].filter((id) => !uebernommeneIds.has(id));
    if (zuLoeschendeIds.length > 0) {
      await tx.userLiability.deleteMany({ where: { id: { in: zuLoeschendeIds } } });
    }
  });

  revalidatePath("/profil");
}
