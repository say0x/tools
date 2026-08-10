import { prisma } from "@/server/db";
import { PROPERTY_INCLUDE } from "./mappers";

export async function ladeObjekt(id: string) {
  return prisma.property.findUnique({ where: { id }, include: PROPERTY_INCLUDE });
}

export async function ladeObjekte() {
  return prisma.property.findMany({ include: PROPERTY_INCLUDE, orderBy: { createdAt: "desc" } });
}

export async function ladeObjekteNachIds(ids: string[]) {
  return prisma.property.findMany({ where: { id: { in: ids } }, include: PROPERTY_INCLUDE });
}
