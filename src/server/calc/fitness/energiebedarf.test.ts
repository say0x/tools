import { describe, expect, it } from "vitest";
import { berechneBmi, berechneEnergiebedarf, berechneGrundumsatz, berechneMakroziele } from "./energiebedarf";
import type { FitnessProfilInput } from "./types";

const basisProfil: FitnessProfilInput = {
  groesseCm: 180,
  geburtsjahr: 1991,
  geschlecht: "MAENNLICH",
  aktivitaetslevel: "LEICHT",
  ziel: "ABNEHMEN",
  zielTempoKgProWoche: 0.5,
  zielGewichtKg: 75,
  kalorienzielKcal: null,
  kalorienzielOverride: false,
  proteinGProKg: 1.8,
  fettAnteilProzent: 30,
  wasserZielMl: null,
  schritteZiel: 10000,
  trainingskalorienAnrechnen: true,
};

describe("berechneGrundumsatz (Mifflin-St Jeor)", () => {
  it("Mann: 10·80 + 6,25·180 − 5·35 + 5 = 1755", () => {
    expect(berechneGrundumsatz(80, 180, 35, "MAENNLICH")).toBe(1755);
  });

  it("Frau: 10·65 + 6,25·168 − 5·30 − 161 = 1389", () => {
    expect(berechneGrundumsatz(65, 168, 30, "WEIBLICH")).toBe(1389);
  });
});

describe("berechneBmi", () => {
  it("80 kg / 1,80 m ≈ 24,7 → Normalgewicht", () => {
    const { bmi, kategorie } = berechneBmi(80, 180);
    expect(bmi).toBeCloseTo(24.69, 2);
    expect(kategorie).toBe("NORMALGEWICHT");
  });

  it.each([
    [55, 180, "UNTERGEWICHT"],
    [90, 180, "UEBERGEWICHT"],
    [100, 180, "ADIPOSITAS"],
  ] as const)("%s kg / %s cm → %s", (kg, cm, erwartet) => {
    expect(berechneBmi(kg, cm).kategorie).toBe(erwartet);
  });
});

describe("berechneEnergiebedarf", () => {
  it("leitet Gesamtumsatz, Defizit-Ziel, Makros und Wasser her", () => {
    const e = berechneEnergiebedarf(basisProfil, 80, 2026);

    expect(e.alter).toBe(35);
    expect(e.grundumsatz).toBe(1755);
    expect(e.palFaktor).toBe(1.5);
    expect(e.gesamtumsatz).toBeCloseTo(2632.5, 5);
    expect(e.zielAnpassungKcal).toBeCloseTo(-550, 5);
    expect(e.kalorienziel).toBe(2083);
    expect(e.defizitBegrenzt).toBe(false);
    expect(e.unterUntergrenze).toBe(false);

    expect(e.makros.proteinG).toBeCloseTo(144, 5);
    expect(e.makros.fettG).toBeCloseTo((2083 * 0.3) / 9, 5);
    expect(e.makros.kohlenhydrateG).toBeCloseTo((2083 - 144 * 4 - 2083 * 0.3) / 4, 5);
    expect(e.wasserZielMl).toBe(2800);
  });

  it("HALTEN: Ziel = Gesamtumsatz", () => {
    const e = berechneEnergiebedarf({ ...basisProfil, ziel: "HALTEN" }, 80, 2026);
    expect(e.zielAnpassungKcal).toBe(0);
    expect(e.kalorienziel).toBe(Math.round(2632.5));
  });

  it("ZUNEHMEN mit 0,25 kg/Woche: +275 kcal/Tag", () => {
    const e = berechneEnergiebedarf({ ...basisProfil, ziel: "ZUNEHMEN", zielTempoKgProWoche: 0.25 }, 80, 2026);
    expect(e.zielAnpassungKcal).toBeCloseTo(275, 5);
    expect(e.kalorienziel).toBe(Math.round(2632.5 + 275));
  });

  it("begrenzt ein zu großes Defizit auf den Grundumsatz", () => {
    const profil: FitnessProfilInput = {
      ...basisProfil,
      geschlecht: "WEIBLICH",
      groesseCm: 165,
      geburtsjahr: 1986,
      aktivitaetslevel: "SITZEND",
      zielTempoKgProWoche: 1,
    };
    const e = berechneEnergiebedarf(profil, 60, 2026);
    // GU = 600 + 1031,25 − 200 − 161 = 1270,25; Gesamtumsatz 1778,35; −1100 = 678 → angehoben
    expect(e.grundumsatz).toBeCloseTo(1270.25, 5);
    expect(e.defizitBegrenzt).toBe(true);
    expect(e.kalorienziel).toBe(1270);
  });

  it("manueller Override gewinnt und wird unter der Untergrenze markiert", () => {
    const e = berechneEnergiebedarf({ ...basisProfil, kalorienzielOverride: true, kalorienzielKcal: 1000 }, 80, 2026);
    expect(e.kalorienziel).toBe(1000);
    expect(e.kalorienzielBerechnet).toBe(2083);
    expect(e.unterUntergrenze).toBe(true);
  });

  it("Override ohne Wert fällt auf das berechnete Ziel zurück", () => {
    const e = berechneEnergiebedarf({ ...basisProfil, kalorienzielOverride: true, kalorienzielKcal: null }, 80, 2026);
    expect(e.kalorienziel).toBe(2083);
  });

  it("eigenes Wasserziel ersetzt die 35-ml/kg-Regel", () => {
    expect(berechneEnergiebedarf({ ...basisProfil, wasserZielMl: 3500 }, 80, 2026).wasserZielMl).toBe(3500);
  });

  it("Wasserziel nie unter 1,5 l", () => {
    expect(berechneEnergiebedarf(basisProfil, 40, 2026).wasserZielMl).toBe(1500);
  });
});

describe("berechneMakroziele", () => {
  it("setzt Kohlenhydrate auf 0, wenn Protein + Fett das Ziel übersteigen", () => {
    const m = berechneMakroziele(1000, 100, 2, 30);
    expect(m.proteinG).toBe(200);
    expect(m.kohlenhydrateG).toBe(0);
    expect(m.kohlenhydrateAufNullBegrenzt).toBe(true);
  });
});
