import { describe, expect, it } from "vitest";
import { ermittleDedupKriterium } from "./import-dedup";

describe("ermittleDedupKriterium", () => {
  it("nutzt quelleUrl als Kriterium, wenn vorhanden", () => {
    const kriterium = ermittleDedupKriterium({ name: "Musterstraße 12", quelleUrl: "https://www.immobilienscout24.de/expose/123" });

    expect(kriterium).toEqual({ quelleUrl: "https://www.immobilienscout24.de/expose/123" });
  });

  it("fällt auf den Namen zurück, wenn quelleUrl fehlt", () => {
    const kriterium = ermittleDedupKriterium({ name: "Musterstraße 12" });

    expect(kriterium).toEqual({ name: "Musterstraße 12" });
  });

  it("fällt auf den Namen zurück, wenn quelleUrl ein leerer String ist", () => {
    const kriterium = ermittleDedupKriterium({ name: "Musterstraße 12", quelleUrl: "" });

    expect(kriterium).toEqual({ name: "Musterstraße 12" });
  });

  it("behandelt eine nicht-string quelleUrl als nicht vorhanden, statt sie zu coercen", () => {
    // Reale Gefahr bei handgepflegtem JSON: eine Zahl oder ein Objekt statt eines Strings.
    const kriterium = ermittleDedupKriterium({ name: "Musterstraße 12", quelleUrl: 12345 });

    expect(kriterium).toEqual({ name: "Musterstraße 12" });
  });

  it("nutzt den Platzhalter-Namen, wenn sowohl quelleUrl als auch name fehlen", () => {
    const kriterium = ermittleDedupKriterium({});

    expect(kriterium).toEqual({ name: "(ohne Namen)" });
  });

  it("behandelt Namen mit unterschiedlicher Groß-/Kleinschreibung als unterschiedliche Kriterien", () => {
    // Dokumentiert bewusst das bestehende Verhalten (Prisma-Exact-Match, kein
    // Trimming/Lowercasing) — bei uneinheitlicher Schreibweise in der
    // Import-Datei entstehen dadurch stille Duplikate statt eines Treffers.
    const a = ermittleDedupKriterium({ name: "Musterstraße 12" });
    const b = ermittleDedupKriterium({ name: "musterstraße 12" });

    expect(a).not.toEqual(b);
  });
});
