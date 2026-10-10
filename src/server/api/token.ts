import { createHash, randomBytes } from "node:crypto";

/**
 * API-Tokens: "tk_" + 32 Zufallsbytes (base64url, 256 Bit). Gespeichert wird
 * nur der SHA-256-Hash — ein Datenbank-Leak verrät keine nutzbaren Tokens.
 * Ein langsamer Passwort-Hash (bcrypt/argon2) ist hier unnötig: die Tokens
 * haben volle Zufalls-Entropie, Wörterbuch-/Brute-Force-Angriffe greifen nicht.
 * Referenz: docs/api/README.md#authentifizierung
 */

const TOKEN_PRAEFIX = "tk_";
const TOKEN_MUSTER = /^tk_[A-Za-z0-9_-]{43}$/;

export function hashApiToken(klartext: string): string {
  return createHash("sha256").update(klartext, "utf8").digest("hex");
}

export function erzeugeApiToken(): { klartext: string; hash: string; praefix: string } {
  const klartext = TOKEN_PRAEFIX + randomBytes(32).toString("base64url");
  return { klartext, hash: hashApiToken(klartext), praefix: klartext.slice(0, 9) };
}

export function istTokenFormat(wert: string): boolean {
  return TOKEN_MUSTER.test(wert);
}

/** Liest "Authorization: Bearer tk_..." (Groß-/Kleinschreibung des Schemas egal). */
export function extrahiereBearerToken(header: string | null): string | null {
  if (!header) return null;
  const treffer = /^Bearer\s+(\S+)\s*$/i.exec(header.trim());
  return treffer && istTokenFormat(treffer[1]) ? treffer[1] : null;
}
