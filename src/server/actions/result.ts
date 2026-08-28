import { unstable_rethrow } from "next/navigation";

export type ActionResult<T = void> = { success: true; data: T } | { success: false; error: string };

/**
 * Wandelt eine Server-Action-Funktion in ein ActionResult um, statt Fehler zu werfen.
 *
 * Next.js redigiert in Produktion (nicht im Dev-Server!) jede aus einer Server Action
 * geworfene Fehlermeldung client-seitig zu einem generischen "Minified React error #441"-
 * Text — das bisherige throw/catch(err.message)-Muster in den Formularen kam beim Nutzer
 * dadurch nie an, obwohl es in jedem lokalen `npm run dev`-Test funktionierte (empirisch
 * verifiziert per Playwright gegen einen echten `npm run build && npm run start`-Build).
 * Rückgabewerte statt throw sind der von Next.js dokumentierte Weg, Fehlertexte
 * zuverlässig zum Client durchzureichen — Details: ADR-0008.
 *
 * redirect()/notFound()/etc. innerhalb von fn() laufen über unstable_rethrow() unverändert
 * durch — nur echte Fehler werden abgefangen, serverseitig geloggt (Next.js selbst loggt
 * unbehandelte Fehler zwar bereits nach stdout, aber ohne Kontext, welche Action betroffen
 * war) und als ActionResult zurückgegeben.
 */
export async function ausfuehren<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error) {
    unstable_rethrow(error);
    console.error("[server-action]", error);
    return { success: false, error: error instanceof Error ? error.message : "Unbekannter Fehler." };
  }
}
