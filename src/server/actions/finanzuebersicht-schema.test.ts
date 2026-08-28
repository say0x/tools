import { describe, expect, it } from "vitest";
import { finanzuebersichtSchema, type SparpositionFormValues } from "./finanzuebersicht-schema";

function validSparposition(overrides: Partial<SparpositionFormValues> = {}): SparpositionFormValues {
  return {
    art: "WERTPAPIERDEPOT",
    name: "MSCI World ETF",
    besitzstatus: "BESITZE_ICH",
    betrag: 10_000,
    renditeProzentJaehrlich: 6,
    sparplanBetragMonatlich: 200,
    sparplanSteigerungProzentJaehrlich: 0,
    ...overrides,
  };
}

function validValues() {
  return {
    bruttoEinkommenMonatlich: 5000,
    gehaltssteigerungProzentJaehrlich: 2,
    inflationProzentJaehrlich: 2,
    sparpositionen: [validSparposition()],
  };
}

describe("finanzuebersichtSchema — Grundfelder", () => {
  it("akzeptiert gültige Werte", () => {
    expect(finanzuebersichtSchema.safeParse(validValues()).success).toBe(true);
  });

  it("lehnt negatives Brutto-Einkommen ab", () => {
    const values = validValues();
    values.bruttoEinkommenMonatlich = -1;
    expect(finanzuebersichtSchema.safeParse(values).success).toBe(false);
  });

  it("lehnt unrealistisch hohes Brutto-Einkommen ab", () => {
    const values = validValues();
    values.bruttoEinkommenMonatlich = 1_000_001;
    expect(finanzuebersichtSchema.safeParse(values).success).toBe(false);
  });

  it("lehnt negative Inflationsrate ab", () => {
    const values = validValues();
    values.inflationProzentJaehrlich = -0.1;
    expect(finanzuebersichtSchema.safeParse(values).success).toBe(false);
  });

  it("akzeptiert eine leere Sparpositionen-Liste", () => {
    const values = validValues();
    values.sparpositionen = [];
    expect(finanzuebersichtSchema.safeParse(values).success).toBe(true);
  });
});

describe("finanzuebersichtSchema — Sparpositionen", () => {
  it("assetId ist optional (neue, noch nicht gespeicherte Position)", () => {
    const values = validValues();
    expect(finanzuebersichtSchema.safeParse(values).success).toBe(true);
  });

  it("akzeptiert eine gesetzte assetId (bestehende Position)", () => {
    const values = validValues();
    values.sparpositionen = [validSparposition({ assetId: "cmt7existing0000000000000" })];
    expect(finanzuebersichtSchema.safeParse(values).success).toBe(true);
  });

  it("lehnt eine fehlende Bezeichnung ab", () => {
    const values = validValues();
    values.sparpositionen = [validSparposition({ name: "" })];
    const result = finanzuebersichtSchema.safeParse(values);
    expect(result.success).toBe(false);
  });

  it("lehnt eine ungültige Positionsart ab", () => {
    const values = validValues();
    // @ts-expect-error absichtlich ungültiger Wert für den Enum-Test
    values.sparpositionen = [validSparposition({ art: "TAGESGELDKONTO" })];
    expect(finanzuebersichtSchema.safeParse(values).success).toBe(false);
  });

  it("akzeptiert TAGESGELD als zweite gültige Positionsart", () => {
    const values = validValues();
    values.sparpositionen = [validSparposition({ art: "TAGESGELD" })];
    expect(finanzuebersichtSchema.safeParse(values).success).toBe(true);
  });

  it("lehnt einen negativen Betrag ab", () => {
    const values = validValues();
    values.sparpositionen = [validSparposition({ betrag: -1 })];
    expect(finanzuebersichtSchema.safeParse(values).success).toBe(false);
  });

  it("lehnt eine negative Sparrate ab", () => {
    const values = validValues();
    values.sparpositionen = [validSparposition({ sparplanBetragMonatlich: -50 })];
    expect(finanzuebersichtSchema.safeParse(values).success).toBe(false);
  });

  it("akzeptiert eine negative Rendite innerhalb des realistischen Bereichs", () => {
    const values = validValues();
    values.sparpositionen = [validSparposition({ renditeProzentJaehrlich: -20 })];
    expect(finanzuebersichtSchema.safeParse(values).success).toBe(true);
  });

  it("lehnt eine Rendite außerhalb des realistischen Bereichs ab", () => {
    const values = validValues();
    values.sparpositionen = [validSparposition({ renditeProzentJaehrlich: -51 })];
    expect(finanzuebersichtSchema.safeParse(values).success).toBe(false);
  });

  it("lehnt eine negative Sparraten-Steigerung ab", () => {
    const values = validValues();
    values.sparpositionen = [validSparposition({ sparplanSteigerungProzentJaehrlich: -1 })];
    expect(finanzuebersichtSchema.safeParse(values).success).toBe(false);
  });
});
