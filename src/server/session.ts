import { cache } from "react";
import { cookies } from "next/headers";
import { prisma } from "@/server/db";

export const ACTIVE_USER_COOKIE = "tools_active_user_id";

/**
 * ACHTUNG: Kein Sicherheitsmechanismus. Der Cookie ist unsigniert und wird nie
 * kryptografisch geprüft — jeder mit Zugriff auf den Browser oder das
 * VPN-Netzwerk kann sich durch Setzen dieses Cookies als beliebiger Test-User
 * ausgeben. Dient ausschließlich dazu, das Mehrbenutzer-Datenmodell lokal mit
 * mehreren Test-Identitäten zu verifizieren, solange es noch kein echtes
 * Auth-System gibt (siehe ADR-0009, Revision von ADR-0006). Muss durch echte,
 * verifizierte Session-Auflösung ersetzt werden, bevor "tools" jemals
 * außerhalb des VPN-only-Homelabs läuft — die Aufrufer dieser Funktion
 * bleiben dabei unverändert, nur ihr Innenleben wird ausgetauscht.
 *
 * React-Request-Cache (wie ladeObjekt() in src/server/data/property.ts):
 * Seiten wie das Dashboard rufen mehrere Loader parallel per Promise.all()
 * auf, die alle getActiveUserId() aufrufen. Ohne cache() liefen bei einem
 * Erstbesuch ohne Cookie mehrere Aufrufe gleichzeitig in den
 * "kein Nutzer vorhanden"-Zweig und legten mehrere "Standard"-User parallel
 * an (empirisch mit Playwright/curl gegen eine echte DB verifiziert) — mit
 * cache() läuft der Fallback nur einmal pro Request.
 */
export const getActiveUserId = cache(async (): Promise<string> => {
  const store = await cookies();
  const cookieUserId = store.get(ACTIVE_USER_COOKIE)?.value;
  if (cookieUserId) return cookieUserId;

  // Kein Cookie gesetzt (frischer Browser, gelöschte Cookies, o. ä.). cookies()
  // lässt sich in einer Server Component nicht schreiben (nur in Server
  // Actions/Route Handlern) — daher hier nur lesend auf den zuerst angelegten
  // Test-User zurückfallen, statt den Cookie zu setzen. Ein bewusster Wechsel
  // über den Nutzer-Switcher (src/server/actions/user.ts) setzt den Cookie dauerhaft.
  const ersterNutzer = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (ersterNutzer) return ersterNutzer.id;

  // Allererster Start überhaupt: noch kein einziger Test-User existiert. Wird
  // automatisch angelegt, damit die App ohne manuellen Vorab-Schritt nutzbar
  // bleibt (kein Zwang, erst eine Picker-Seite zu besuchen).
  const neuerNutzer = await prisma.user.create({ data: { name: "Standard" } });
  return neuerNutzer.id;
});
