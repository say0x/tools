import { describe, expect, it } from "vitest";
import { ermittleAnnahmenWarnungen } from "../annahmen-warnungen";

describe("ermittleAnnahmenWarnungen", () => {
  it("gibt keine Warnung bei plausiblen Annahmen", () => {
    const warnungen = ermittleAnnahmenWarnungen({
      leerstandsquoteProzent: 3,
      wertsteigerungProzentJaehrlich: 2,
      mietsteigerungProzentJaehrlich: 2,
    });

    expect(warnungen).toEqual([]);
  });

  it("warnt bei einer Leerstandsquote unter 1%", () => {
    const warnungen = ermittleAnnahmenWarnungen({
      leerstandsquoteProzent: 0,
      wertsteigerungProzentJaehrlich: 2,
      mietsteigerungProzentJaehrlich: 2,
    });

    expect(warnungen).toEqual([{ typ: "LEERSTAND_UNREALISTISCH", leerstandsquoteProzent: 0 }]);
  });

  it("warnt bei einer Wertsteigerungsannahme über 3%/Jahr", () => {
    const warnungen = ermittleAnnahmenWarnungen({
      leerstandsquoteProzent: 3,
      wertsteigerungProzentJaehrlich: 4.5,
      mietsteigerungProzentJaehrlich: 2,
    });

    expect(warnungen).toEqual([{ typ: "WERTSTEIGERUNG_OPTIMISTISCH", wertsteigerungProzentJaehrlich: 4.5 }]);
  });

  it("warnt bei einer Mietsteigerungsannahme über 3%/Jahr", () => {
    const warnungen = ermittleAnnahmenWarnungen({
      leerstandsquoteProzent: 3,
      wertsteigerungProzentJaehrlich: 2,
      mietsteigerungProzentJaehrlich: 3.5,
    });

    expect(warnungen).toEqual([{ typ: "MIETSTEIGERUNG_OPTIMISTISCH", mietsteigerungProzentJaehrlich: 3.5 }]);
  });

  it("kombiniert mehrere Warnungen", () => {
    const warnungen = ermittleAnnahmenWarnungen({
      leerstandsquoteProzent: 0,
      wertsteigerungProzentJaehrlich: 5,
      mietsteigerungProzentJaehrlich: 5,
    });

    expect(warnungen.map((w) => w.typ)).toEqual([
      "LEERSTAND_UNREALISTISCH",
      "WERTSTEIGERUNG_OPTIMISTISCH",
      "MIETSTEIGERUNG_OPTIMISTISCH",
    ]);
  });

  it("löst die Schwelle nicht bei exakt dem Grenzwert aus", () => {
    const warnungen = ermittleAnnahmenWarnungen({
      leerstandsquoteProzent: 1,
      wertsteigerungProzentJaehrlich: 3,
      mietsteigerungProzentJaehrlich: 3,
    });

    expect(warnungen).toEqual([]);
  });
});
