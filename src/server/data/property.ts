import { cache } from "react";
import { prisma } from "@/server/db";
import { PROPERTY_INCLUDE } from "./mappers";

// React-Request-Cache: generateMetadata() und die Seite selbst rufen beide ladeObjekt(id)
// mit derselben id auf — cache() dedupliziert das zu einer einzigen DB-Anfrage pro Request.
export const ladeObjekt = cache(async (id: string) => {
  return prisma.property.findUnique({ where: { id }, include: PROPERTY_INCLUDE });
});

export async function ladeObjekte() {
  return prisma.property.findMany({ include: PROPERTY_INCLUDE, orderBy: { createdAt: "desc" } });
}

export async function ladeObjekteNachIds(ids: string[]) {
  return prisma.property.findMany({ where: { id: { in: ids } }, include: PROPERTY_INCLUDE });
}
