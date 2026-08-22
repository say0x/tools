import type { AnnahmenWarnung } from "@/server/calc/types";

/** Rendert eine Annahmen-Warnung aus der Calc-Engine zu einem fertigen deutschen Text mit eingesetzten Zahlen. */
export function formatiereAnnahmenWarnung(warnung: AnnahmenWarnung): { titel: string; text: string } {
  if (warnung.typ === "LEERSTAND_UNREALISTISCH") {
    return {
      titel: "Leerstandsquote sehr niedrig angesetzt",
      text: `${warnung.leerstandsquoteProzent}% Leerstand ist auf lange Sicht kaum realistisch — auch bei guten Lagen kommt es üblicherweise zu gelegentlichem Mieterwechsel mit Leerstandstagen. Ein zu niedriger Wert schönt den Cashflow.`,
    };
  }
  if (warnung.typ === "WERTSTEIGERUNG_OPTIMISTISCH") {
    return {
      titel: "Wertsteigerungsannahme sehr optimistisch",
      text: `${warnung.wertsteigerungProzentJaehrlich}%/Jahr liegt deutlich über der langfristigen Preisentwicklung in Deutschland. Über mehrere Jahrzehnte gerechnet verstärkt sich der Effekt exponentiell und kann Vermögensverlauf und Verkaufsszenario stark schönen.`,
    };
  }
  return {
    titel: "Mietsteigerungsannahme sehr optimistisch",
    text: `${warnung.mietsteigerungProzentJaehrlich}%/Jahr liegt deutlich über üblichen Mietsteigerungen und ignoriert ggf. Kappungsgrenzen (§558 BGB) bei laufenden Mietverhältnissen. Über lange Horizonte schönt das den Cashflow-Verlauf spürbar.`,
  };
}
