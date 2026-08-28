import { describe, expect, it } from "vitest";
import { Decimal } from "@prisma/client/runtime/client";
import { immobilienPositionAusErgebnis, berechneSparpositionPositionen } from "./vermoegen";
import type { PropertyWithAsset, WertpapierpositionWithAsset, TagesgeldkontoWithAsset } from "./mappers";
import type { CalculationResult } from "@/server/calc/types";

const dec = (value: number) => new Decimal(value);

function buildPropertyRow(kaufdatum: Date, overrides: Partial<PropertyWithAsset> = {}): PropertyWithAsset {
  return {
    id: "prop_1",
    assetId: "asset_1",
    kaufpreis: dec(300000),
    kaufdatum,
    asset: { name: "Testobjekt", besitzstatus: "BESITZE_ICH" },
    ...overrides,
  } as unknown as PropertyWithAsset;
}

// vermoegensverlauf[i] repräsentiert "Jahr i+1 seit Kauf" — jedes Jahr trägt seinen Index
// als eindeutigen Marker (cashflow/eigenkapitalanteil/immobilienwert = 100*(jahr)), damit
// eine falsche Indizierung (Off-by-one) in den Assertions sofort auffällt.
function buildVermoegensverlauf(jahre: number): CalculationResult["vermoegensverlauf"] {
  return Array.from({ length: jahre }, (_, i) => {
    const jahr = i + 1;
    return {
      jahr,
      cashflowNachSteuerJahr: jahr * 100,
      eigenkapitalanteil: jahr * 1000,
      immobilienwert: jahr * 10000,
    } as unknown as CalculationResult["vermoegensverlauf"][number];
  });
}

function buildResult(jahre: number, eigenkapitalEinsatzEuro = 50000): CalculationResult {
  return {
    finanzierung: { eigenkapitalEinsatzEuro, gesamtinvestitionEuro: 0, darlehenssummeEuro: 0 },
    vermoegensverlauf: buildVermoegensverlauf(jahre),
  } as unknown as CalculationResult;
}

describe("immobilienPositionAusErgebnis", () => {
  it("schlägt für ein vor 3 Jahren gekauftes Objekt den Eintrag von Jahr 3 nach (kein Off-by-one)", () => {
    const heute = new Date("2026-01-01");
    const row = buildPropertyRow(new Date("2023-01-01"));
    const result = buildResult(10);

    const position = immobilienPositionAusErgebnis(row, result, heute);

    expect(position.jahreSeitKauf).toBe(3);
    expect(position.eigenkapitalanteilHeuteReferenz).toBe(3000); // vermoegensverlauf[2] = Jahr 3
    expect(position.immobilienwertHeuteReferenz).toBe(30000);
  });

  it("fällt für ein geplantes (zukünftiges) Objekt auf eigenkapitalEinsatzEuro/kaufpreis zurück, statt einen Verlauf-Eintrag zu erraten", () => {
    const heute = new Date("2026-01-01");
    const row = buildPropertyRow(new Date("2028-01-01")); // Kauf in der Zukunft
    const result = buildResult(10, 42000);

    const position = immobilienPositionAusErgebnis(row, result, heute);

    expect(position.jahreSeitKauf).toBe(-2);
    expect(position.eigenkapitalanteilHeuteReferenz).toBe(42000);
    expect(position.immobilienwertHeuteReferenz).toBe(300000); // row.kaufpreis
  });

  it("fällt für ein im aktuellen Jahr gekauftes Objekt (jahreSeitKauf=0) ebenfalls auf die Referenzwerte zurück", () => {
    const heute = new Date("2026-06-01");
    const row = buildPropertyRow(new Date("2026-01-01"));
    const result = buildResult(10, 15000);

    const position = immobilienPositionAusErgebnis(row, result, heute);

    expect(position.jahreSeitKauf).toBe(0);
    expect(position.eigenkapitalanteilHeuteReferenz).toBe(15000);
  });

  it("klemmt einen Kauf, der länger zurückliegt als der berechnete Verlauf, auf den letzten verfügbaren Eintrag", () => {
    const heute = new Date("2026-01-01");
    const row = buildPropertyRow(new Date("1990-01-01")); // 36 Jahre her
    const result = buildResult(30); // Verlauf nur bis Jahr 30

    const position = immobilienPositionAusErgebnis(row, result, heute);

    expect(position.jahreSeitKauf).toBe(36);
    expect(position.eigenkapitalanteilHeuteReferenz).toBe(30000); // letzter Eintrag = Jahr 30, nicht undefined/Absturz
    expect(position.immobilienwertHeuteReferenz).toBe(300000);
  });

  it("gibt kaufpreis als number (nicht Decimal) und den vollständigen Cashflow-/EK-Verlauf zurück", () => {
    const row = buildPropertyRow(new Date("2023-01-01"));
    const result = buildResult(5);

    const position = immobilienPositionAusErgebnis(row, result, new Date("2026-01-01"));

    expect(position.kaufpreis).toBe(300000);
    expect(position.cashflowNachSteuerProJahrSeitKauf).toEqual([100, 200, 300, 400, 500]);
    expect(position.eigenkapitalanteilProJahrSeitKauf).toEqual([1000, 2000, 3000, 4000, 5000]);
  });
});

describe("berechneSparpositionPositionen", () => {
  it("wandelt Wertpapier- und Tagesgeld-Positionen einheitlich um, inkl. Decimal->number", () => {
    const wertpapier = {
      assetId: "asset_wp",
      asset: { name: "MSCI World ETF", besitzstatus: "BESITZE_ICH" },
      betrag: dec(40000),
      renditeProzentJaehrlich: dec(7),
      sparplanBetragMonatlich: dec(200),
      sparplanSteigerungProzentJaehrlich: dec(2),
    } as unknown as WertpapierpositionWithAsset;
    const tagesgeld = {
      assetId: "asset_tg",
      asset: { name: "Tagesgeld Bank X", besitzstatus: "POTENZIELLE_ANSCHAFFUNG" },
      betrag: dec(20000),
      zinsProzentJaehrlich: dec(3.2),
      sparplanBetragMonatlich: dec(0),
      sparplanSteigerungProzentJaehrlich: dec(0),
    } as unknown as TagesgeldkontoWithAsset;

    const positionen = berechneSparpositionPositionen([wertpapier], [tagesgeld]);

    expect(positionen).toEqual([
      {
        assetId: "asset_wp",
        name: "MSCI World ETF",
        art: "WERTPAPIERDEPOT",
        besitzstatus: "BESITZE_ICH",
        betrag: 40000,
        renditeProzentJaehrlich: 7,
        sparplanBetragMonatlich: 200,
        sparplanSteigerungProzentJaehrlich: 2,
      },
      {
        assetId: "asset_tg",
        name: "Tagesgeld Bank X",
        art: "TAGESGELD",
        besitzstatus: "POTENZIELLE_ANSCHAFFUNG",
        betrag: 20000,
        renditeProzentJaehrlich: 3.2, // aus zinsProzentJaehrlich gemappt
        sparplanBetragMonatlich: 0,
        sparplanSteigerungProzentJaehrlich: 0,
      },
    ]);
  });
});
