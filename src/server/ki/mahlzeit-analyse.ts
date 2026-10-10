import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { KI_KONFIDENZEN } from "@/server/calc/fitness/types";
import { pruefeKiAnalyse, type KiAnalyseGeprueft } from "@/server/calc/fitness/ki-plausibilitaet";

/**
 * KI-Fotoanalyse von Mahlzeiten über die Claude API (Vision + Structured
 * Outputs). Optional: ohne ANTHROPIC_API_KEY ist die Funktion schlicht nicht
 * verfügbar, der Rest des Fitness-Moduls funktioniert unverändert.
 *
 * Datenfluss: das Foto geht (verkleinert) an die Anthropic-API und wird von
 * "tools" selbst NICHT gespeichert — gespeichert werden nur die vom Nutzer
 * bestätigten Nährwerte. Begründung & Alternativen: ADR-0010.
 * Referenz: docs/tools/fitness.md#ki-fotoanalyse
 */

export const STANDARD_MODELL = "claude-opus-5-5";

/** Modelle, die den serverseitigen Refusal-Fallback ("default") unterstützen. */
const MODELLE_MIT_FALLBACK = new Set(["claude-fable-5-1", "claude-opus-5-5", "claude-opus-5", "claude-sonnet-5-5"]);

export const ERLAUBTE_BILDTYPEN = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
type Bildtyp = (typeof ERLAUBTE_BILDTYPEN)[number];

/** Obergrenze der API für ein einzelnes Bild (dekodiert). */
export const MAX_BILD_BYTES = 5 * 1024 * 1024;

const positionSchema = z.object({
  bezeichnung: z.string().describe("Kurzer deutscher Name des Lebensmittels, z. B. 'Spaghetti, gekocht'"),
  mengeG: z.number().describe("Geschätzte Menge in Gramm (Getränke: ml)"),
  kcal: z.number().describe("Energie dieser Menge in kcal"),
  proteinG: z.number(),
  kohlenhydrateG: z.number().describe("Verwertbare Kohlenhydrate (ohne Ballaststoffe)"),
  fettG: z.number(),
});

export const mahlzeitAnalyseSchema = z.object({
  erkannt: z.boolean().describe("false, wenn auf dem Bild keine Lebensmittel/Getränke zu sehen sind"),
  beschreibung: z.string().describe("Ein Satz, was zu sehen ist"),
  positionen: z.array(positionSchema),
  konfidenz: z.enum(KI_KONFIDENZEN).describe("Gesamtsicherheit der Mengen-/Nährwertschätzung"),
  hinweise: z.string().describe("Annahmen und Unsicherheiten, z. B. verstecktes Öl oder unklare Portionsgröße; leer, wenn keine"),
});

const SYSTEM_PROMPT = `Du schätzt Nährwerte von Mahlzeiten auf Fotos für ein persönliches Ernährungstagebuch (Deutschland).

Zerlege die Mahlzeit in sinnvolle Positionen (Hauptkomponenten, Beilagen, Soßen, Getränke) und schätze für jede Position die Menge in Gramm sowie kcal, Protein, verwertbare Kohlenhydrate und Fett für genau diese Menge. Nutze sichtbare Größenreferenzen (Teller, Besteck, Hände, Verpackungen) für die Portionsgröße und typische Werte deutscher Nährwerttabellen. Berücksichtige wahrscheinlich verwendetes Öl, Butter oder Dressing als eigene Position, wenn es für die Zubereitung typisch ist, und nenne diese Annahme in den Hinweisen. Eine zusätzliche Beschreibung des Nutzers hat Vorrang vor deiner Bildinterpretation.

Ist die Schätzung unsicher (verdeckte Zutaten, ungewöhnliche Perspektive), setze die Konfidenz entsprechend niedriger. Sind keine Lebensmittel zu sehen, setze erkannt=false und gib keine Positionen an.`;

export type MahlzeitAnalyse = KiAnalyseGeprueft & { modell: string };

export type KiFehlerArt = "NICHT_KONFIGURIERT" | "BILD_UNGUELTIG" | "LIMIT" | "API";

export class KiAnalyseFehler extends Error {
  constructor(
    message: string,
    readonly art: KiFehlerArt = "API"
  ) {
    super(message);
  }
}

export function kiAnalyseKonfiguriert(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

/**
 * Einfacher Kostendeckel je Server-Prozess und Kalendertag (Default 100
 * Analysen, KI_FOTO_LIMIT_PRO_TAG) — schützt vor versehentlichen Schleifen,
 * z. B. einer falsch konfigurierten Automation. Zählt im Speicher, ein
 * Neustart setzt ihn zurück; für ein Homelab-Tool bewusst ausreichend.
 */
const tageszaehler = { tag: "", anzahl: 0 };

export function pruefeUndZaehleKiTageslimit(jetzt = new Date()): void {
  const limit = Number(process.env.KI_FOTO_LIMIT_PRO_TAG ?? 100);
  const tag = jetzt.toISOString().slice(0, 10);
  if (tageszaehler.tag !== tag) {
    tageszaehler.tag = tag;
    tageszaehler.anzahl = 0;
  }
  if (Number.isFinite(limit) && limit >= 0 && tageszaehler.anzahl >= limit) {
    throw new KiAnalyseFehler(`Tageslimit von ${limit} KI-Analysen erreicht (KI_FOTO_LIMIT_PRO_TAG).`, "LIMIT");
  }
  tageszaehler.anzahl++;
}

export function kiModell(): string {
  return process.env.ANTHROPIC_MODEL?.trim() || STANDARD_MODELL;
}

/** Akzeptiert eine Data-URL ("data:image/jpeg;base64,...") und prüft Typ und Größe. */
export function zerlegeBildDataUrl(dataUrl: string): { mediaType: Bildtyp; base64: string } {
  const treffer = /^data:([a-z/+.-]+);base64,([A-Za-z0-9+/=\s]+)$/i.exec(dataUrl.trim());
  if (!treffer) throw new KiAnalyseFehler("Ungültiges Bildformat — erwartet wird ein Foto (JPEG, PNG, WebP oder GIF).", "BILD_UNGUELTIG");
  const mediaType = treffer[1].toLowerCase();
  if (!(ERLAUBTE_BILDTYPEN as readonly string[]).includes(mediaType)) {
    throw new KiAnalyseFehler(`Bildtyp ${mediaType} wird nicht unterstützt — bitte JPEG, PNG, WebP oder GIF verwenden.`, "BILD_UNGUELTIG");
  }
  const base64 = treffer[2].replace(/\s/g, "");
  const bytes = Math.floor((base64.length * 3) / 4);
  if (bytes > MAX_BILD_BYTES) throw new KiAnalyseFehler("Bild ist zu groß (max. 5 MB) — bitte verkleinern.", "BILD_UNGUELTIG");
  if (bytes < 100) throw new KiAnalyseFehler("Bild ist leer oder beschädigt.", "BILD_UNGUELTIG");
  const erkannt = erkenneBildtyp(base64);
  if (!erkannt) {
    throw new KiAnalyseFehler(
      "Die Daten sind kein JPEG-, PNG-, WebP- oder GIF-Bild. iPhone-Fotos (HEIC) bitte vorher in JPEG umwandeln.",
      "BILD_UNGUELTIG"
    );
  }
  // Der tatsächliche Inhalt gewinnt über die Angabe des Clients — die Claude API lehnt abweichende media_types ab.
  return { mediaType: erkannt, base64 };
}

/** Bildtyp anhand der Signatur der ersten Bytes. */
function erkenneBildtyp(base64: string): Bildtyp | null {
  const kopf = Buffer.from(base64.slice(0, 24), "base64");
  const ascii = (von: number, bis: number) => kopf.subarray(von, bis).toString("latin1");
  if (kopf[0] === 0xff && kopf[1] === 0xd8 && kopf[2] === 0xff) return "image/jpeg";
  if (kopf[0] === 0x89 && ascii(1, 4) === "PNG") return "image/png";
  if (ascii(0, 4) === "GIF8") return "image/gif";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  return null;
}

/** Kleinste Schnittstelle des SDK-Clients, die hier gebraucht wird — erlaubt einen Fake in Tests. */
export type MahlzeitAnalyseClient = Pick<Anthropic, "beta">;

let standardClient: Anthropic | null = null;
function client(): Anthropic {
  standardClient ??= new Anthropic({ timeout: 90_000, maxRetries: 2 });
  return standardClient;
}

export async function analysiereMahlzeitBild(
  eingabe: { dataUrl: string; hinweis?: string },
  apiClient: MahlzeitAnalyseClient | null = null
): Promise<MahlzeitAnalyse> {
  if (!apiClient && !kiAnalyseKonfiguriert()) {
    throw new KiAnalyseFehler("KI-Fotoanalyse ist nicht eingerichtet — dafür muss ANTHROPIC_API_KEY in der Server-Umgebung gesetzt sein.", "NICHT_KONFIGURIERT");
  }
  const { mediaType, base64 } = zerlegeBildDataUrl(eingabe.dataUrl);
  pruefeUndZaehleKiTageslimit();
  const hinweis = eingabe.hinweis?.trim().slice(0, 500);
  const modell = kiModell();

  let antwort;
  try {
    antwort = await (apiClient ?? client()).beta.messages.parse({
      model: modell,
      max_tokens: 16_000,
      ...(MODELLE_MIT_FALLBACK.has(modell) ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
      output_config: { effort: "medium", format: betaZodOutputFormat(mahlzeitAnalyseSchema) },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
            { type: "text", text: hinweis ? `Analysiere diese Mahlzeit. Angaben des Nutzers: ${hinweis}` : "Analysiere diese Mahlzeit." },
          ],
        },
      ],
    });
  } catch (error) {
    throw uebersetzeApiFehler(error);
  }

  if (antwort.stop_reason === "refusal") {
    throw new KiAnalyseFehler("Die KI hat die Analyse dieses Bildes abgelehnt. Bitte ein anderes Foto verwenden oder manuell eintragen.");
  }
  if (antwort.stop_reason === "max_tokens" || !antwort.parsed_output) {
    throw new KiAnalyseFehler("Die KI-Antwort war unvollständig. Bitte erneut versuchen.");
  }

  return { ...pruefeKiAnalyse(antwort.parsed_output), modell: antwort.model };
}

function uebersetzeApiFehler(error: unknown): Error {
  if (error instanceof KiAnalyseFehler) return error;
  if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
    return new KiAnalyseFehler("Der hinterlegte ANTHROPIC_API_KEY ist ungültig oder hat keine Berechtigung.");
  }
  if (error instanceof Anthropic.RateLimitError) {
    return new KiAnalyseFehler("Rate-Limit der KI-API erreicht — bitte in einer Minute erneut versuchen.", "LIMIT");
  }
  if (error instanceof Anthropic.BadRequestError) {
    return new KiAnalyseFehler(`Die KI-API hat die Anfrage abgelehnt: ${error.message}`);
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return new KiAnalyseFehler("Die KI-API ist vom Server aus nicht erreichbar (Netzwerk/Firewall prüfen).");
  }
  if (error instanceof Anthropic.APIError) {
    return new KiAnalyseFehler(`Fehler der KI-API (${error.status ?? "unbekannt"}). Bitte später erneut versuchen.`);
  }
  return error instanceof Error ? error : new Error("Unbekannter Fehler bei der KI-Analyse.");
}
