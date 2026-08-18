import type { PortfolioJahr } from "../types";

export interface SparpositionVerlaufInput {
  betrag: number;
  renditeProzentJaehrlich: number;
  /** Zusätzlicher monatlicher Sparplan in diese Position — 0 = kein Sparplan. */
  sparplanBetragMonatlich: number;
  /** Jährliche Steigerung des Sparplan-Betrags (z. B. analog zur Gehaltssteigerung). */
  sparplanSteigerungProzentJaehrlich: number;
}

/** Für das Szenario-System: springt die monatliche Sparrate ab einem bestimmten Jahr auf einen neuen Betrag. */
export interface SparratenAenderung {
  /** Jahre ab heute (1-basiert, wie die Jahresreihe), ab dem die neue Rate gilt. */
  abJahr: number;
  neueSparrateMonatlich: number;
}

/**
 * Jahresreihe für eine einzelne Wertpapier-/Tagesgeld-Position, ab heute
 * (Index 0 = aktueller Betrag). Vereinfachung: Sparplanraten werden jährlich
 * am Jahresanfang gutgeschrieben und wachsen dann mit der Position mit
 * (keine unterjährige/monatliche Verzinsung). Optional lässt sich (fürs
 * Szenario-System) ein einmaliger Sprung der Sparrate ab einem Jahr angeben —
 * die reguläre jährliche Steigerung läuft ab dann auf Basis der neuen Rate weiter.
 */
export function berechneSparpositionsverlauf(
  input: SparpositionVerlaufInput,
  horizontJahre: number,
  sparratenAenderung?: SparratenAenderung
): number[] {
  const reihe: number[] = [round2(input.betrag)];
  let saldo = input.betrag;
  let sparrateJaehrlich = input.sparplanBetragMonatlich * 12;

  for (let jahr = 1; jahr <= horizontJahre; jahr++) {
    if (sparratenAenderung && jahr === sparratenAenderung.abJahr) {
      sparrateJaehrlich = sparratenAenderung.neueSparrateMonatlich * 12;
    }
    saldo = saldo * (1 + input.renditeProzentJaehrlich / 100) + sparrateJaehrlich;
    reihe.push(round2(saldo));
    sparrateJaehrlich = sparrateJaehrlich * (1 + input.sparplanSteigerungProzentJaehrlich / 100);
  }

  return reihe;
}

/**
 * Jahresreihe des Eigenkapitalanteils einer Immobilie, ab heute (Index 0 =
 * heutiger Stand). Nutzt den bereits vorhandenen, auf das Kaufdatum bezogenen
 * Eigenkapitalanteil-Verlauf der Immobilien-Engine (`vermoegensverlauf`,
 * Jahr 1..50 seit Kauf) und schneidet ihn auf den Zeitraum "heute bis
 * heute+horizontJahre" zu. Vereinfachung: reicht der Betrachtungszeitraum der
 * Immobilie (50 Jahre seit Kauf) nicht mehr bis zum Ende des gewählten
 * Finanzübersicht-Horizonts, wird der letzte verfügbare Wert fortgeschrieben
 * (keine weitere Wertsteigerung/Tilgung über 50 Jahre seit Kauf hinaus).
 */
export function berechneImmobilienEigenkapitalverlauf(
  eigenkapitalanteilProJahrSeitKauf: number[],
  jahreSeitKauf: number,
  eigenkapitalBeiKauf: number,
  horizontJahre: number
): number[] {
  const jahreSeitKaufHeute = Math.max(0, jahreSeitKauf);

  const wertBeiOffsetSeitKauf = (offsetSeitKauf: number): number => {
    if (offsetSeitKauf <= 0) return eigenkapitalBeiKauf;
    if (eigenkapitalanteilProJahrSeitKauf.length === 0) return eigenkapitalBeiKauf;
    const index = Math.min(offsetSeitKauf, eigenkapitalanteilProJahrSeitKauf.length) - 1;
    return eigenkapitalanteilProJahrSeitKauf[index];
  };

  return Array.from({ length: horizontJahre + 1 }, (_, n) => round2(wertBeiOffsetSeitKauf(jahreSeitKaufHeute + n)));
}

export interface ImmobilienCashflowVerlaufInput {
  /** Cashflow nach Steuer je Jahr seit Kauf (Index 0 = Jahr 1 seit Kauf), aus `vermoegensverlauf[].cashflowNachSteuerJahr`. */
  cashflowNachSteuerProJahrSeitKauf: number[];
  /** Jahre seit Kauf, ab heute gerechnet — negativ, wenn der Kauf noch in der Zukunft liegt (geplanter Kauf). */
  jahreSeitKauf: number;
  /** Eigenkapital-Einsatz beim Kauf — nur relevant, wenn `jahreSeitKauf` negativ ist (siehe unten). */
  eigenkapitalEinsatzBeiKauf: number;
}

/**
 * Jahresreihe des tatsächlich verfügbaren (liquiden) Geldes, das eine
 * Immobilie ab heute beisteuert — NICHT ihr Wert oder Eigenkapitalanteil,
 * die stecken im Objekt und sind nicht "Geld, das ich habe". Startet bei 0
 * (Index 0 = heute) und akkumuliert ab dem nächsten Jahr den Cashflow nach
 * Steuer aus dem bereits vorhandenen Vermögensverlauf der Objekt-Engine.
 * Bereits laufende Objekte (jahreSeitKauf >= 0): der beim Kauf eingesetzte
 * Eigenkapitalbetrag ist Vergangenheit (vor "heute" bereits abgeflossen) und
 * wird hier NICHT nochmal abgezogen — nur der Cashflow ab heute zählt.
 * Geplante/zukünftige Käufe (jahreSeitKauf < 0): im Kaufjahr wird der
 * Eigenkapital-Einsatz einmalig als Abfluss simuliert, danach läuft der
 * Cashflow wie gewohnt weiter. Reicht der 50-Jahres-Verlauf der Objekt-Engine
 * nicht bis zum Ende des Horizonts, wird der letzte verfügbare Jahres-Cashflow
 * fortgeschrieben (gleiche Vereinfachung wie beim Eigenkapitalanteil-Verlauf).
 */
export function berechneImmobilienCashflowverlauf(input: ImmobilienCashflowVerlaufInput, horizontJahre: number): number[] {
  const reihe: number[] = [0];
  let kumuliert = 0;

  for (let n = 1; n <= horizontJahre; n++) {
    const offsetSeitKauf = input.jahreSeitKauf + n;

    if (input.jahreSeitKauf < 0 && offsetSeitKauf === 0) {
      kumuliert -= input.eigenkapitalEinsatzBeiKauf;
    } else if (offsetSeitKauf >= 1 && input.cashflowNachSteuerProJahrSeitKauf.length > 0) {
      const index = Math.min(offsetSeitKauf, input.cashflowNachSteuerProJahrSeitKauf.length) - 1;
      kumuliert += input.cashflowNachSteuerProJahrSeitKauf[index];
    }

    reihe.push(round2(kumuliert));
  }

  return reihe;
}

/**
 * Szenario-Baustein "Immobilie verkaufen": friert den Cashflow-Verlauf einer
 * bereits besessenen Immobilie ab dem Verkaufsjahr auf dem dann erreichten
 * Stand ein (kein weiterer Cashflow danach — sie gehört ja nicht mehr) und
 * addiert einmalig den Verkaufserlös. Vereinfachung: der Verkaufserlös wird
 * danach nicht weiter verzinst/reinvestiert, er bleibt als fester Betrag
 * stehen — und ignoriert Restschuld-Ablösung/Steuern beim Verkauf, da diese
 * Kalkulation dafür bewusst nicht in den Verkaufserlös (Marktwert-Referenz)
 * eingerechnet ist.
 */
export function wendeImmobilienverkaufAn(
  verlauf: number[],
  verkaufsjahrAbHeute: number,
  verkaufserloes: number
): number[] {
  if (verlauf.length === 0) return verlauf;
  const indexBeiVerkauf = Math.min(Math.max(verkaufsjahrAbHeute, 0), verlauf.length - 1);
  const standBeiVerkauf = verlauf[indexBeiVerkauf];

  return verlauf.map((wert, n) => (n < verkaufsjahrAbHeute ? wert : round2(standBeiVerkauf + verkaufserloes)));
}

export interface EinmaligeAnschaffungInput {
  betrag: number;
  /** Jahre ab heute (0 = heute), in dem die Ausgabe anfällt. */
  jahrAbHeute: number;
}

/**
 * Szenario-Baustein "Einmalige Anschaffung" (z. B. Autokauf): reduziert das
 * verfügbare Geld einmalig im gewählten Jahr um den Betrag und bleibt danach
 * konstant auf diesem (negativen) Niveau — das ausgegebene Geld ist weg,
 * der angeschaffte Gegenstand selbst ist bewusst kein eigenes Asset mit
 * Wertverlauf (kein eigenes Fahrzeug-/Sachwert-Tool nötig für diesen Zweck).
 */
export function berechneEinmaligeAnschaffungVerlauf(input: EinmaligeAnschaffungInput, horizontJahre: number): number[] {
  return Array.from({ length: horizontJahre + 1 }, (_, n) => (n < input.jahrAbHeute ? 0 : -input.betrag));
}

export interface PortfolioPositionVerlauf {
  id: string;
  name: string;
  verlauf: number[]; // Länge horizontJahre + 1, Index 0 = heute
}

/**
 * Kombiniert alle Positionsverläufe (Immobilien-Eigenkapital, Wertpapier- und
 * Tagesgeld-Positionen) zu einer Gesamtvermögens-Jahresreihe, nominal und
 * inflationsbereinigt. Die "real"-Linie rechnet mit der frei konfigurierbaren
 * Inflationsrate ab (keine separat modellierte CPI-Reihe).
 */
export function berechnePortfolioverlauf(
  positionen: PortfolioPositionVerlauf[],
  horizontJahre: number,
  inflationProzentJaehrlich: number,
  startjahr: number = new Date().getFullYear()
): PortfolioJahr[] {
  return Array.from({ length: horizontJahre + 1 }, (_, jahr) => {
    const proPosition: Record<string, number> = {};
    let gesamtNominal = 0;
    for (const position of positionen) {
      const wert = position.verlauf[jahr] ?? 0;
      proPosition[position.id] = wert;
      gesamtNominal += wert;
    }

    const inflationsfaktor = Math.pow(1 + inflationProzentJaehrlich / 100, jahr);

    return {
      jahr,
      kalenderjahr: startjahr + jahr,
      gesamtNominal: round2(gesamtNominal),
      gesamtReal: round2(gesamtNominal / inflationsfaktor),
      proPosition,
    };
  });
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
