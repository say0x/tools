import { berechneBmi } from "@/server/calc/fitness/energiebedarf";
import type { Gewichtsverlauf } from "@/server/calc/fitness/gewichtstrend";
import type { FitnessTag, FitnessZeitraum } from "@/server/data/fitness";
import type { DashboardKennzahlen } from "@/server/data/dashboard-kennzahlen";
import { eineStelle, ganz } from "./dto";

/**
 * Flache Sensorstruktur für Home Assistant: EIN Request liefert alle Werte,
 * die HA per `rest:`-Integration auf einzelne Sensoren verteilt
 * (`value_template: "{{ value_json.fitness.kalorien_verbleibend }}"`).
 * Snake_case-Namen, weil sie in HA-Templates und Entity-IDs landen.
 * Unbekannte Werte sind null (HA zeigt dann "unbekannt" statt einer falschen 0).
 * Referenz: docs/integrations/home-assistant.md
 */

export interface HomeAssistantSensorEingabe {
  zeitpunkt: Date;
  tag: FitnessTag;
  woche: FitnessZeitraum;
  gewicht: Gewichtsverlauf;
  finanzen: DashboardKennzahlen;
}

const rundeOderNull = (n: number | null | undefined, f: (n: number) => number) => (n == null ? null : f(n));
const euro = (n: number) => Math.round(n * 100) / 100;

export function baueHomeAssistantSensoren({ zeitpunkt, tag, woche, gewicht, finanzen }: HomeAssistantSensorEingabe) {
  const e = tag.energiebedarf;
  const b = tag.bilanz;
  const groesseCm = tag.profil?.groesseCm;
  const bmi = gewicht.aktuellGeglaettetKg != null && groesseCm ? berechneBmi(gewicht.aktuellGeglaettetKg, groesseCm).bmi : null;
  const trainingHeute = tag.trainings.reduce((s, t) => s + t.dauerMin, 0);
  const trainingKcalHeute = tag.trainings.reduce((s, t) => s + t.verbrauch.kcal, 0);

  return {
    zeitpunkt: zeitpunkt.toISOString(),
    datum: tag.datum,
    fitness: {
      kalorien_ziel: e?.kalorienziel ?? null,
      kalorien_gegessen: ganz(tag.zugefuehrt.kcal),
      kalorien_training: ganz(trainingKcalHeute),
      kalorien_budget: rundeOderNull(b?.budget, ganz),
      kalorien_verbleibend: rundeOderNull(b?.verbleibend, ganz),
      kalorien_prozent: rundeOderNull(b?.budgetProzent, ganz),
      ueber_budget: b?.ueberBudget ?? null,
      protein_g: eineStelle(tag.zugefuehrt.proteinG),
      protein_ziel_g: rundeOderNull(e?.makros.proteinG, ganz),
      kohlenhydrate_g: eineStelle(tag.zugefuehrt.kohlenhydrateG),
      kohlenhydrate_ziel_g: rundeOderNull(e?.makros.kohlenhydrateG, ganz),
      fett_g: eineStelle(tag.zugefuehrt.fettG),
      fett_ziel_g: rundeOderNull(e?.makros.fettG, ganz),
      wasser_ml: tag.aktivitaet?.wasserMl ?? 0,
      wasser_ziel_ml: tag.wasserZielMl,
      schritte: tag.aktivitaet?.schritte ?? null,
      schritte_ziel: tag.schritteZiel,
      schlaf_stunden: tag.aktivitaet?.schlafStunden ?? null,
      ruhepuls: tag.aktivitaet?.ruhepuls ?? null,
      mahlzeiten_heute: tag.mahlzeiten.length,
      training_minuten_heute: trainingHeute,
      training_minuten_7_tage: woche.statistik.trainingMinuten,
      training_einheiten_7_tage: woche.statistik.trainingAnzahl,
      kalorien_schnitt_7_tage: rundeOderNull(woche.statistik.durchschnittKcal, ganz),
      tage_im_zielkorridor_7_tage: woche.statistik.tageImZielkorridor,
      gewicht_kg: rundeOderNull(gewicht.aktuellKg, eineStelle),
      gewicht_7_tage_kg: rundeOderNull(gewicht.aktuellGeglaettetKg, eineStelle),
      gewicht_trend_kg_pro_woche: rundeOderNull(gewicht.trendKgProWoche, (n) => Math.round(n * 100) / 100),
      gewicht_ziel_kg: tag.profil?.zielGewichtKg ?? null,
      gewicht_prognose_status: gewicht.prognose.status,
      gewicht_prognose_datum: gewicht.prognose.datum,
      bmi: rundeOderNull(bmi, eineStelle),
    },
    finanzen: {
      vermoegen_referenz_eur: euro(finanzen.gesamtvermoegenReferenz),
      vermoegen_netto_eur: euro(finanzen.gesamtvermoegenNetto),
      bargeld_und_depots_eur: euro(finanzen.sparvermoegen),
      tagesgeld_eur: euro(finanzen.tagesgeldImBesitz),
      restschulden_eur: euro(finanzen.gesamtSchuldenRestschuld),
      notgroschen_monate: rundeOderNull(finanzen.notgroschenMonate, eineStelle),
      immobilien_cashflow_monatlich_eur: euro(finanzen.monatlicherImmobilienCashflow),
      immobilien_im_besitz: finanzen.objekteImBesitz,
      objekte_gesamt: finanzen.objekteGesamt,
      objekte_ampel_gruen: finanzen.ampelVerteilung.GRUEN,
      objekte_ampel_gelb: finanzen.ampelVerteilung.GELB,
      objekte_ampel_rot: finanzen.ampelVerteilung.ROT,
      bruttorendite_schnitt_prozent: rundeOderNull(finanzen.durchschnittlicheBruttorendite, eineStelle),
      szenarien: finanzen.szenarienAnzahl,
    },
  };
}

