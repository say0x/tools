import { afterEach, describe, expect, it, vi } from "vitest";
import { analysiereMahlzeitBild, kiAnalyseKonfiguriert, kiModell, zerlegeBildDataUrl, type MahlzeitAnalyseClient } from "./mahlzeit-analyse";

// 1×1-Pixel-JPEG-Ersatz: der Inhalt ist egal, nur Format/Größe werden geprüft.
const BILD = `data:image/jpeg;base64,${"A".repeat(400)}`;

const analyse = {
  erkannt: true,
  beschreibung: "Spaghetti mit Tomatensoße",
  positionen: [
    { bezeichnung: "Spaghetti, gekocht", mengeG: 250, kcal: 375, proteinG: 13.75, kohlenhydrateG: 75, fettG: 2.25 },
    { bezeichnung: "Tomatensoße", mengeG: 150, kcal: 90, proteinG: 2.4, kohlenhydrateG: 10.5, fettG: 4.2 },
  ],
  konfidenz: "MITTEL" as const,
  hinweise: "Ölmenge in der Soße geschätzt.",
};

function fakeClient(antwort: Record<string, unknown>) {
  const parse = vi
    .fn<(params: Record<string, unknown>) => Promise<unknown>>()
    .mockResolvedValue({ model: "claude-opus-5-5", stop_reason: "end_turn", parsed_output: analyse, ...antwort });
  return { client: { beta: { messages: { parse } } } as unknown as MahlzeitAnalyseClient, parse };
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("analysiereMahlzeitBild", () => {
  it("schickt Bild + Hinweis mit Structured Output und liefert geprüfte Positionen samt Summe", async () => {
    const { client, parse } = fakeClient({});
    const ergebnis = await analysiereMahlzeitBild({ dataUrl: BILD, hinweis: "große Portion" }, client);

    const params = parse.mock.calls[0][0] as {
      model: string;
      messages: { content: { type: string; source?: { media_type: string }; text?: string }[] }[];
      output_config: { format: unknown; effort: string };
      fallbacks?: string;
      betas?: string[];
    };
    expect(params.model).toBe("claude-opus-5-5");
    expect(params.messages[0].content[0]).toMatchObject({ type: "image", source: { media_type: "image/jpeg" } });
    expect(params.messages[0].content[1].text).toContain("große Portion");
    expect(params.output_config.format).toBeDefined();
    expect(params.output_config.effort).toBe("medium");
    expect(params.fallbacks).toBe("default");
    expect(params.betas).toEqual(["server-side-fallback-2026-07-01"]);

    expect(ergebnis.erkannt).toBe(true);
    expect(ergebnis.positionen).toHaveLength(2);
    expect(ergebnis.positionen[0].proteinG).toBe(13.8);
    expect(ergebnis.summe.kcal).toBe(465);
    expect(ergebnis.modell).toBe("claude-opus-5-5");
  });

  it("verwendet ANTHROPIC_MODEL und lässt den Fallback weg, wenn das Modell ihn nicht unterstützt", async () => {
    vi.stubEnv("ANTHROPIC_MODEL", "claude-haiku-5-5");
    const { client, parse } = fakeClient({});
    await analysiereMahlzeitBild({ dataUrl: BILD }, client);
    const params = parse.mock.calls[0][0] as { model: string; fallbacks?: string };
    expect(params.model).toBe("claude-haiku-5-5");
    expect(params.fallbacks).toBeUndefined();
  });

  it("meldet eine Ablehnung (stop_reason refusal) verständlich", async () => {
    const { client } = fakeClient({ stop_reason: "refusal", parsed_output: null });
    await expect(analysiereMahlzeitBild({ dataUrl: BILD }, client)).rejects.toThrow("abgelehnt");
  });

  it("meldet eine abgeschnittene Antwort", async () => {
    const { client } = fakeClient({ stop_reason: "max_tokens", parsed_output: null });
    await expect(analysiereMahlzeitBild({ dataUrl: BILD }, client)).rejects.toThrow("unvollständig");
  });

  it("ohne API-Schlüssel und ohne Client: klare Fehlermeldung statt Netzwerkaufruf", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    expect(kiAnalyseKonfiguriert()).toBe(false);
    await expect(analysiereMahlzeitBild({ dataUrl: BILD })).rejects.toThrow("ANTHROPIC_API_KEY");
  });

  it("kein Essen erkannt → erkannt=false", async () => {
    const { client } = fakeClient({ parsed_output: { ...analyse, erkannt: false, positionen: [] } });
    expect((await analysiereMahlzeitBild({ dataUrl: BILD }, client)).erkannt).toBe(false);
  });
});

describe("zerlegeBildDataUrl", () => {
  it("akzeptiert JPEG/PNG/WebP-Data-URLs", () => {
    expect(zerlegeBildDataUrl(BILD).mediaType).toBe("image/jpeg");
    expect(zerlegeBildDataUrl(BILD.replace("jpeg", "png")).mediaType).toBe("image/png");
  });

  it("lehnt andere Typen, Nicht-Data-URLs und zu große Bilder ab", () => {
    expect(() => zerlegeBildDataUrl(BILD.replace("image/jpeg", "image/heic"))).toThrow("nicht unterstützt");
    expect(() => zerlegeBildDataUrl("https://example.org/bild.jpg")).toThrow("Ungültiges Bildformat");
    expect(() => zerlegeBildDataUrl(`data:image/jpeg;base64,${"A".repeat(7_000_000)}`)).toThrow("zu groß");
  });
});

describe("kiModell", () => {
  it("Standard ist claude-opus-5-5", () => {
    vi.stubEnv("ANTHROPIC_MODEL", "");
    expect(kiModell()).toBe("claude-opus-5-5");
  });
});

describe("pruefeUndZaehleKiTageslimit", () => {
  it("blockiert nach Erreichen des Limits und setzt am nächsten Tag zurück", async () => {
    const { pruefeUndZaehleKiTageslimit } = await import("./mahlzeit-analyse");
    vi.stubEnv("KI_FOTO_LIMIT_PRO_TAG", "2");
    const tag1 = new Date("2030-01-01T10:00:00Z");
    pruefeUndZaehleKiTageslimit(tag1);
    pruefeUndZaehleKiTageslimit(tag1);
    expect(() => pruefeUndZaehleKiTageslimit(tag1)).toThrow("Tageslimit");
    expect(() => pruefeUndZaehleKiTageslimit(new Date("2030-01-02T10:00:00Z"))).not.toThrow();
  });
});
