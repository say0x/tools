import type { KiKonfidenz, Naehrwerte } from "./types";

/**
 * Nachbearbeitung einer KI-Schätzung (Foto-Analyse), bevor sie dem Nutzer zur
 * Kontrolle angezeigt wird: Werte runden, Unplausibles kennzeichnen. Die KI
 * liefert Schätzungen — der Nutzer bestätigt/korrigiert immer selbst, nichts
 * wird ohne Klick gespeichert.
 */

export interface KiPosition extends Naehrwerte {
  bezeichnung: string;
  mengeG: number;
}

export interface KiAnalyseRoh {
  erkannt: boolean;
  beschreibung: string;
  positionen: KiPosition[];
  konfidenz: KiKonfidenz;
  hinweise: string;
}

export interface KiAnalyseGeprueft extends KiAnalyseRoh {
  summe: Naehrwerte;
  /** Positionen, deren kcal deutlich von 4·P + 4·KH + 9·F abweichen (Hinweis an den Nutzer). */
  inkonsistentePositionen: string[];
}

const runde = (n: number, stellen = 0) => {
  const f = 10 ** stellen;
  return Math.round(Math.max(0, Number.isFinite(n) ? n : 0) * f) / f;
};

export function pruefeKiAnalyse(roh: KiAnalyseRoh): KiAnalyseGeprueft {
  const positionen = roh.positionen
    .filter((p) => p.bezeichnung.trim() !== "")
    .map((p) => ({
      bezeichnung: p.bezeichnung.trim().slice(0, 200),
      mengeG: runde(p.mengeG),
      kcal: runde(p.kcal),
      proteinG: runde(p.proteinG, 1),
      kohlenhydrateG: runde(p.kohlenhydrateG, 1),
      fettG: runde(p.fettG, 1),
    }));

  const inkonsistentePositionen = positionen
    .filter((p) => {
      const atwater = 4 * p.proteinG + 4 * p.kohlenhydrateG + 9 * p.fettG;
      return p.kcal > 50 && Math.abs(atwater - p.kcal) > Math.max(30, p.kcal * 0.25);
    })
    .map((p) => p.bezeichnung);

  const roheSumme = positionen.reduce(
    (s, p) => ({ kcal: s.kcal + p.kcal, proteinG: s.proteinG + p.proteinG, kohlenhydrateG: s.kohlenhydrateG + p.kohlenhydrateG, fettG: s.fettG + p.fettG }),
    { kcal: 0, proteinG: 0, kohlenhydrateG: 0, fettG: 0 }
  );
  // Erneut runden: Summen von 1-Nachkommastellen-Werten erzeugen Gleitkomma-Reste (14.100000000000001).
  const summe = {
    kcal: runde(roheSumme.kcal),
    proteinG: runde(roheSumme.proteinG, 1),
    kohlenhydrateG: runde(roheSumme.kohlenhydrateG, 1),
    fettG: runde(roheSumme.fettG, 1),
  };

  return { ...roh, erkannt: roh.erkannt && positionen.length > 0, positionen, summe, inkonsistentePositionen };
}

/**
 * Skaliert die Nährwerte einer Position proportional, wenn der Nutzer die
 * geschätzte Menge korrigiert ("das war eher 300 g statt 200 g").
 */
export function skalierePosition(position: KiPosition, neueMengeG: number): KiPosition {
  if (position.mengeG <= 0 || neueMengeG < 0) return { ...position, mengeG: Math.max(0, neueMengeG) };
  const f = neueMengeG / position.mengeG;
  return {
    ...position,
    mengeG: neueMengeG,
    kcal: runde(position.kcal * f),
    proteinG: runde(position.proteinG * f, 1),
    kohlenhydrateG: runde(position.kohlenhydrateG * f, 1),
    fettG: runde(position.fettG * f, 1),
  };
}
