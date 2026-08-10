import { berechneAfaJaehrlich } from "../tax/afa";
import { berechneGrenzsteuersatz } from "../tax/grenzsteuersatz";
import { GEBAEUDEANTEIL_PROZENT } from "../constants";
import type { PropertyInput, RenditeKennzahlen, TilgungsplanJahr } from "../types";

export interface RenditeKennzahlenInput {
  property: PropertyInput;
  kaufpreis: number;
  gesamtinvestitionEuro: number;
  eigenkapitalEinsatzEuro: number;
  instandhaltungsruecklageTatsaechlichMonatlich: number;
  tilgungsplanJahr1: TilgungsplanJahr | undefined;
  zuVersteuerndesEinkommenJaehrlich: number;
  steuerjahr: number;
}

export function berechneRenditeKennzahlen(input: RenditeKennzahlenInput): RenditeKennzahlen {
  const { property } = input;

  const jahreskaltmiete = round2(property.kaltmieteMonatlich * 12);
  const bruttomietrenditeProzent = input.kaufpreis > 0 ? round2((jahreskaltmiete / input.kaufpreis) * 100) : 0;

  const effektiveJahresmiete = round2(jahreskaltmiete * (1 - property.leerstandsquoteProzent / 100));

  // Umlagefähige Posten (Hausgeld umlagefähig, Grundsteuer, ggf. Versicherung)
  // sind für den Eigentümer cash-neutral: Mieter erstattet sie über die
  // Nebenkosten, sie fließen daher weder in die laufenden Kosten noch in die
  // steuerliche Bemessungsgrundlage ein.
  const laufendeKostenMonatlich = round2(
    property.hausgeldNichtUmlagefaehigMonatlich +
      input.instandhaltungsruecklageTatsaechlichMonatlich +
      property.verwaltungskostenMonatlich +
      (property.versicherungUmlagefaehig ? 0 : property.versicherungJaehrlich / 12)
  );

  const nettomietrenditeProzent =
    input.gesamtinvestitionEuro > 0
      ? round2(((effektiveJahresmiete - laufendeKostenMonatlich * 12) / input.gesamtinvestitionEuro) * 100)
      : 0;

  const kaufpreisfaktor = jahreskaltmiete > 0 ? round2(input.kaufpreis / jahreskaltmiete) : 0;

  const finanzierungsrateMonatlich = input.tilgungsplanJahr1
    ? round2((input.tilgungsplanJahr1.zinszahlung + input.tilgungsplanJahr1.tilgungszahlung) / 12)
    : 0;

  const monatlicherCashflowVorSteuer = round2(
    effektiveJahresmiete / 12 - laufendeKostenMonatlich - finanzierungsrateMonatlich
  );

  const grenzsteuersatzProzent = berechneGrenzsteuersatz(input.zuVersteuerndesEinkommenJaehrlich, input.steuerjahr);

  const gebaeudewertEuro = input.kaufpreis * (GEBAEUDEANTEIL_PROZENT / 100);
  const afaJaehrlich = berechneAfaJaehrlich(gebaeudewertEuro, property.afaSatzProzent);
  const zinsJahr1 = input.tilgungsplanJahr1?.zinszahlung ?? 0;

  const steuerlichesErgebnisJahr = round2(
    effektiveJahresmiete - laufendeKostenMonatlich * 12 - zinsJahr1 - afaJaehrlich
  );
  const steuerEuroJahr = round2(steuerlichesErgebnisJahr * (grenzsteuersatzProzent / 100));

  const monatlicherCashflowNachSteuer = round2(monatlicherCashflowVorSteuer - steuerEuroJahr / 12);

  const eigenkapitalrenditeProzent =
    input.eigenkapitalEinsatzEuro > 0
      ? round2(((monatlicherCashflowNachSteuer * 12) / input.eigenkapitalEinsatzEuro) * 100)
      : 0;

  return {
    jahreskaltmiete,
    bruttomietrenditeProzent,
    nettomietrenditeProzent,
    kaufpreisfaktor,
    monatlicherCashflowVorSteuer,
    monatlicherCashflowNachSteuer,
    eigenkapitalrenditeProzent,
    grenzsteuersatzProzent,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
