import type { Verhandlungsargument } from "@/server/calc/types";
import { EIGENTUMSTYP_LABELS, GEWERK_LABELS } from "@/lib/labels";
import { formatEuro } from "@/lib/format";

/** Rendert ein Verhandlungsargument aus der Calc-Engine zu einem fertigen deutschen Text mit eingesetzten Zahlen. */
export function formatiereVerhandlungsargument(arg: Verhandlungsargument): { titel: string; text: string } {
  if (arg.typ === "GEWERK_RISIKO") {
    const zustandsBezeichnung = arg.zustand === 6 ? "sehr schlechten" : "schlechten";
    const kostenSatz = arg.istOverride
      ? `wurden dafür manuell ${formatEuro(arg.geschaetzteKostenEuro)} veranschlagt`
      : `ist mit Kosten von rund ${formatEuro(arg.geschaetzteKostenEuro)} zu rechnen: (${arg.kostenMinProM2}+${arg.kostenMaxProM2})/2 = ${arg.mittelwertProM2} €/m² × ${arg.wohnflaeche} m² × ${arg.zustandsfaktorProzent}% Zustandsfaktor`;

    const eigentumshinweis =
      arg.eigentumsTyp === "GEMEINSCHAFTSEIGENTUM"
        ? " Da es sich um Gemeinschaftseigentum handelt, kommt das voraussichtlich über eine WEG-Sonderumlage oder eine erhöhte Instandhaltungsrücklagen-Zuführung auf dich zu."
        : " Das betrifft dich direkt, da es sich um Sondereigentum der Einheit handelt.";

    return {
      titel: `${GEWERK_LABELS[arg.gewerk]} — Zustand ${arg.zustand}/6 (${arg.zustand === 6 ? "sehr schlecht" : "schlecht"})`,
      text: `Da ${GEWERK_LABELS[arg.gewerk]} in einem ${zustandsBezeichnung} Zustand ist (Stufe ${arg.zustand} von 6, ${EIGENTUMSTYP_LABELS[arg.eigentumsTyp]}), ${kostenSatz}.${eigentumshinweis}`,
    };
  }

  if (arg.typ === "INSTANDHALTUNG_UNTERDECKUNG") {
    return {
      titel: "Instandhaltungsrücklage wirkt unterdeckt",
      text: `Die angesetzte Instandhaltungsrücklage (${formatEuro(arg.tatsaechlicheRuecklageMonatlich)}/Monat) liegt ${formatEuro(
        arg.differenzMonatlich
      )}/Monat unter dem anhand von Baujahr und Bauteilzustand empfohlenen Wert (${formatEuro(
        arg.empfohleneRuecklageMonatlich
      )}/Monat) — das deutet auf einen Instandhaltungsstau hin, der beim Kaufpreis berücksichtigt werden sollte.`,
    };
  }

  // CASHFLOW_NEGATIV
  if (arg.breakevenKaufpreis != null && arg.differenzZuAktuellemKaufpreis != null) {
    return {
      titel: "Cashflow nach Steuer ist negativ",
      text: `Der Cashflow nach Steuer ist mit ${formatEuro(arg.cashflowNachSteuerMonatlich)}/Monat negativ. Erst bei einem Kaufpreis von ${formatEuro(
        arg.breakevenKaufpreis
      )} (${formatEuro(arg.differenzZuAktuellemKaufpreis)} unter dem aktuellen Preis von ${formatEuro(
        arg.aktuellerKaufpreis
      )}) wäre er ausgeglichen — eine sachliche Verhandlungsbasis.`,
    };
  }
  return {
    titel: "Cashflow nach Steuer ist negativ",
    text: `Der Cashflow nach Steuer ist mit ${formatEuro(
      arg.cashflowNachSteuerMonatlich
    )}/Monat negativ und bleibt es unter den aktuellen Annahmen auch bei deutlich niedrigerem Kaufpreis.`,
  };
}
