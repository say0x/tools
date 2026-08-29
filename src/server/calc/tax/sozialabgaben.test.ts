import { describe, expect, it } from "vitest";
import { berechneSozialabgaben } from "./sozialabgaben";

const basisOptionen = {
  beschaeftigungsstatus: "ANGESTELLT" as const,
  gesetzlichKrankenversichert: true,
  kinderlos: false,
  bundesland: "NORDRHEIN_WESTFALEN" as const,
};

describe("berechneSozialabgaben", () => {
  it("ist für Selbstständige komplett 0, unabhängig von den übrigen Optionen", () => {
    const ergebnis = berechneSozialabgaben(60000, 2026, { ...basisOptionen, beschaeftigungsstatus: "SELBSTSTAENDIG" });
    expect(ergebnis).toEqual({ rentenversicherung: 0, arbeitslosenversicherung: 0, krankenversicherung: 0, pflegeversicherung: 0, summe: 0 });
  });

  it("berechnet Renten-/Arbeitslosenversicherung unterhalb der Beitragsbemessungsgrenze linear (2026: 9,3%/1,3%)", () => {
    const ergebnis = berechneSozialabgaben(60000, 2026, basisOptionen);
    expect(ergebnis.rentenversicherung).toBeCloseTo(60000 * 0.093, 2);
    expect(ergebnis.arbeitslosenversicherung).toBeCloseTo(60000 * 0.013, 2);
  });

  it("deckelt Renten-/Arbeitslosenversicherung auf die Beitragsbemessungsgrenze (2026: 101.400 €/Jahr)", () => {
    const ergebnis = berechneSozialabgaben(200000, 2026, basisOptionen);
    expect(ergebnis.rentenversicherung).toBeCloseTo(101400 * 0.093, 2);
    expect(ergebnis.arbeitslosenversicherung).toBeCloseTo(101400 * 0.013, 2);
  });

  it("deckelt Kranken-/Pflegeversicherung auf ihre eigene, niedrigere Beitragsbemessungsgrenze (2026: 69.750 €/Jahr)", () => {
    const ergebnis = berechneSozialabgaben(200000, 2026, basisOptionen);
    expect(ergebnis.krankenversicherung).toBeCloseTo(69750 * 0.0875, 1);
  });

  it("ist Kranken-/Pflegeversicherung 0 bei privater Krankenversicherung, Renten-/Arbeitslosenversicherung bleiben unverändert", () => {
    const gesetzlich = berechneSozialabgaben(60000, 2026, basisOptionen);
    const privat = berechneSozialabgaben(60000, 2026, { ...basisOptionen, gesetzlichKrankenversichert: false });
    expect(privat.krankenversicherung).toBe(0);
    expect(privat.pflegeversicherung).toBe(0);
    expect(privat.rentenversicherung).toBeCloseTo(gesetzlich.rentenversicherung, 2);
    expect(privat.arbeitslosenversicherung).toBeCloseTo(gesetzlich.arbeitslosenversicherung, 2);
  });

  it("erhöht die Pflegeversicherung um den Kinderlosenzuschlag (0,6 Prozentpunkte)", () => {
    const mitKindern = berechneSozialabgaben(60000, 2026, { ...basisOptionen, kinderlos: false });
    const kinderlos = berechneSozialabgaben(60000, 2026, { ...basisOptionen, kinderlos: true });
    expect(kinderlos.pflegeversicherung - mitKindern.pflegeversicherung).toBeCloseTo(60000 * 0.006, 2);
  });

  it("Sachsen hat einen höheren Arbeitnehmeranteil an der Pflegeversicherung (Buß- und Bettag-Ausgleich)", () => {
    const nrw = berechneSozialabgaben(60000, 2026, basisOptionen);
    const sachsen = berechneSozialabgaben(60000, 2026, { ...basisOptionen, bundesland: "SACHSEN" });
    expect(sachsen.pflegeversicherung).toBeGreaterThan(nrw.pflegeversicherung);
    // AG-Anteil Sachsen 1,3% statt 1,7% -> AN zahlt die Differenz von 0,4 Punkten zusätzlich.
    expect(sachsen.pflegeversicherung - nrw.pflegeversicherung).toBeCloseTo(60000 * 0.004, 2);
  });

  it("summe entspricht der Summe der vier Einzelbeiträge", () => {
    const ergebnis = berechneSozialabgaben(60000, 2026, basisOptionen);
    expect(ergebnis.summe).toBeCloseTo(
      ergebnis.rentenversicherung + ergebnis.arbeitslosenversicherung + ergebnis.krankenversicherung + ergebnis.pflegeversicherung,
      2
    );
  });

  it("fällt für unbekannte Jahre auf das jüngste bekannte Jahr zurück, statt zu crashen", () => {
    expect(() => berechneSozialabgaben(60000, 2040, basisOptionen)).not.toThrow();
  });
});
