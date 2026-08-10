"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/server/db";

const liabilitySchema = z.object({
  bezeichnung: z.string().min(1, "Bezeichnung fehlt"),
  monatlicheRate: z.coerce.number().min(0),
  restschuld: z.coerce.number().min(0),
});

const profileSchema = z.object({
  nettoEinkommenMonatlich: z.coerce.number().min(0),
  bruttoEinkommenMonatlich: z.coerce.number().min(0),
  zuVersteuerndesEinkommenJaehrlich: z.coerce.number().min(0),
  zvEOverride: z.boolean(),
  fixkostenMonatlich: z.coerce.number().min(0),
  vorhandenesEigenkapital: z.coerce.number().min(0),
  maxSchuldendienstquoteProzent: z.coerce.number().min(0).max(100),
  mindestLiquiditaetsreserveEuro: z.coerce.number().min(0),
  liabilities: z.array(liabilitySchema),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

export async function ladeProfil() {
  return prisma.userProfile.findFirst({ include: { liabilities: true } });
}

export async function upsertProfile(values: ProfileFormValues) {
  const data = profileSchema.parse(values);

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
