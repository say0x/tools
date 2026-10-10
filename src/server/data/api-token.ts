import { prisma } from "@/server/db";
import { erzeugeApiToken, hashApiToken } from "@/server/api/token";

/**
 * Verwaltung und Auflösung von API-Tokens (ADR-0011). Der Klartext eines
 * Tokens verlässt diese Datei nur einmal — als Rückgabe von
 * erstelleApiTokenFuerUser() —, gespeichert wird ausschließlich der Hash.
 */

const MAX_TOKENS_PRO_USER = 20;
/** zuletztGenutztAm höchstens einmal pro Minute schreiben — Home Assistant pollt im Minutentakt. */
const NUTZUNG_AKTUALISIEREN_NACH_MS = 60_000;

export interface ApiTokenAnzeige {
  id: string;
  name: string;
  praefix: string;
  schreibzugriff: boolean;
  zuletztGenutztAm: string | null;
  createdAt: string;
}

export async function ladeApiTokensFuerUser(userId: string): Promise<ApiTokenAnzeige[]> {
  const rows = await prisma.apiToken.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    praefix: r.praefix,
    schreibzugriff: r.schreibzugriff,
    zuletztGenutztAm: r.zuletztGenutztAm?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function erstelleApiTokenFuerUser(userId: string, name: string, schreibzugriff: boolean) {
  const anzahl = await prisma.apiToken.count({ where: { userId } });
  if (anzahl >= MAX_TOKENS_PRO_USER) {
    throw new Error(`Maximal ${MAX_TOKENS_PRO_USER} Tokens je Nutzer — bitte zuerst ein ungenutztes widerrufen.`);
  }
  const token = erzeugeApiToken();
  const row = await prisma.apiToken.create({
    data: { userId, name, schreibzugriff, tokenHash: token.hash, praefix: token.praefix },
  });
  return { id: row.id, klartext: token.klartext, praefix: token.praefix };
}

export async function widerrufeApiTokenFuerUser(userId: string, id: string): Promise<boolean> {
  const { count } = await prisma.apiToken.deleteMany({ where: { id, userId } });
  return count > 0;
}

export interface TokenKontext {
  tokenId: string;
  tokenName: string;
  userId: string;
  userName: string;
  schreibzugriff: boolean;
}

/** Löst ein Klartext-Token auf seinen User auf; null bei unbekanntem/widerrufenem Token. */
export async function loeseApiTokenAuf(klartext: string, jetzt: Date = new Date()): Promise<TokenKontext | null> {
  const row = await prisma.apiToken.findUnique({ where: { tokenHash: hashApiToken(klartext) }, include: { user: true } });
  if (!row) return null;

  if (!row.zuletztGenutztAm || jetzt.getTime() - row.zuletztGenutztAm.getTime() > NUTZUNG_AKTUALISIEREN_NACH_MS) {
    await prisma.apiToken.update({ where: { id: row.id }, data: { zuletztGenutztAm: jetzt } });
  }
  return { tokenId: row.id, tokenName: row.name, userId: row.userId, userName: row.user.name, schreibzugriff: row.schreibzugriff };
}
