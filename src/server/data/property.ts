import { cache } from "react";
import { prisma } from "@/server/db";
import { getActiveUserId } from "@/server/session";
import { PROPERTY_INCLUDE } from "./mappers";

// React-Request-Cache: generateMetadata() und die Seite selbst rufen beide ladeObjekt(id)
// mit derselben id auf — cache() dedupliziert das zu einer einzigen DB-Anfrage pro Request.
export const ladeObjekt = cache(async (id: string) => {
  const userId = await getActiveUserId();
  return prisma.property.findFirst({ where: { id, asset: { userId } }, include: PROPERTY_INCLUDE });
});

export async function ladeObjekte() {
  const userId = await getActiveUserId();
  return prisma.property.findMany({ where: { asset: { userId } }, include: PROPERTY_INCLUDE, orderBy: { createdAt: "desc" } });
}

export async function ladeObjekteNachIds(ids: string[]) {
  const userId = await getActiveUserId();
  return prisma.property.findMany({ where: { id: { in: ids }, asset: { userId } }, include: PROPERTY_INCLUDE });
}
