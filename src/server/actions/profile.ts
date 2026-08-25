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

    await tx.userLiability.deleteMany({ where: { profileId: profile.id } });
    if (data.liabilities.length > 0) {
      await tx.userLiability.createMany({
        data: data.liabilities.map((l) => ({ ...l, profileId: profile.id })),
      });
    }
  });

  revalidatePath("/profil");
}
