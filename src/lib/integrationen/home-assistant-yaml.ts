/**
 * Erzeugt die Home-Assistant-Konfiguration für /integrationen und
 * docs/integrations/home-assistant.md aus EINER Sensorliste — ein Test hält
 * Doku, Seite und den API-Endpunkt (/api/v1/home-assistant/sensoren) synchron.
 */

export interface HaSensor {
  name: string;
  /** Pfad im JSON von /home-assistant/sensoren, z. B. "fitness.kalorien_verbleibend". */
  wert: string;
  einheit?: string;
  deviceClass?: string;
  icon?: string;
  /** measurement für Verlaufsstatistiken; bei Geldbeträgen weglassen (HA erlaubt dort nur "total"). */
  statistik?: boolean;
}

export const HA_SENSOREN: HaSensor[] = [
  { name: "Kalorien verbleibend", wert: "fitness.kalorien_verbleibend", einheit: "kcal", icon: "mdi:food-apple", statistik: true },
  { name: "Kalorien gegessen", wert: "fitness.kalorien_gegessen", einheit: "kcal", icon: "mdi:silverware-fork-knife", statistik: true },
  { name: "Kalorienbudget", wert: "fitness.kalorien_budget", einheit: "kcal", icon: "mdi:target", statistik: true },
  { name: "Kalorienbudget genutzt", wert: "fitness.kalorien_prozent", einheit: "%", icon: "mdi:percent", statistik: true },
  { name: "Trainingskalorien heute", wert: "fitness.kalorien_training", einheit: "kcal", icon: "mdi:fire", statistik: true },
  { name: "Protein heute", wert: "fitness.protein_g", einheit: "g", icon: "mdi:food-steak", statistik: true },
  { name: "Proteinziel", wert: "fitness.protein_ziel_g", einheit: "g", icon: "mdi:food-steak" },
  { name: "Wasser heute", wert: "fitness.wasser_ml", einheit: "mL", icon: "mdi:cup-water", statistik: true },
  { name: "Wasserziel", wert: "fitness.wasser_ziel_ml", einheit: "mL", icon: "mdi:cup-water" },
  { name: "Schritte heute", wert: "fitness.schritte", einheit: "Schritte", icon: "mdi:walk", statistik: true },
  { name: "Training heute", wert: "fitness.training_minuten_heute", einheit: "min", icon: "mdi:run", statistik: true },
  { name: "Training 7 Tage", wert: "fitness.training_minuten_7_tage", einheit: "min", icon: "mdi:calendar-week", statistik: true },
  { name: "Gewicht", wert: "fitness.gewicht_kg", einheit: "kg", deviceClass: "weight", statistik: true },
  { name: "Gewicht 7-Tage-Schnitt", wert: "fitness.gewicht_7_tage_kg", einheit: "kg", deviceClass: "weight", statistik: true },
  { name: "Gewichtstrend", wert: "fitness.gewicht_trend_kg_pro_woche", einheit: "kg/Woche", icon: "mdi:trending-down", statistik: true },
  { name: "Gewicht Zielprognose", wert: "fitness.gewicht_prognose_status", icon: "mdi:flag-checkered" },
  { name: "BMI", wert: "fitness.bmi", icon: "mdi:human", statistik: true },
  { name: "Nettovermögen", wert: "finanzen.vermoegen_netto_eur", einheit: "EUR", icon: "mdi:cash-multiple" },
  { name: "Bargeld und Depots", wert: "finanzen.bargeld_und_depots_eur", einheit: "EUR", icon: "mdi:piggy-bank" },
  { name: "Notgroschen", wert: "finanzen.notgroschen_monate", einheit: "Monate", icon: "mdi:shield-check", statistik: true },
  { name: "Immobilien-Cashflow", wert: "finanzen.immobilien_cashflow_monatlich_eur", einheit: "EUR", icon: "mdi:home-city" },
];

const ID_PRAEFIX = "tools_";
const id = (wert: string) => ID_PRAEFIX + wert.split(".").pop();
const zugriff = (wert: string) => `value_json.${wert}`;

/**
 * value_template + availability: Die API liefert null für unbekannte Werte
 * (z. B. ohne Fitness-Profil). Ohne availability würde HA bei Sensoren mit
 * Einheit "None" als ungültigen Zahlenwert melden — so wird der Sensor
 * stattdessen "nicht verfügbar".
 */
function sensorYaml(s: HaSensor): string {
  const zeilen = [
    `      - name: "${s.name}"`,
    `        unique_id: ${id(s.wert)}`,
    `        value_template: "{{ ${zugriff(s.wert)} }}"`,
    `        availability: "{{ value_json is defined and ${zugriff(s.wert)} is not none }}"`,
  ];
  if (s.einheit) zeilen.push(`        unit_of_measurement: "${s.einheit}"`);
  if (s.deviceClass) zeilen.push(`        device_class: ${s.deviceClass}`);
  if (s.statistik) zeilen.push(`        state_class: measurement`);
  if (s.icon) zeilen.push(`        icon: ${s.icon}`);
  return zeilen.join("\n");
}

export function haSecretsYaml(): string {
  return ['# secrets.yaml — Token aus /integrationen, mit "Bearer " davor', 'tools_api_auth: "Bearer tk_HIER_DEIN_TOKEN"'].join("\n");
}

export function haSensorYaml(basisUrl: string): string {
  return [
    "# configuration.yaml — ein Request alle 5 Minuten liefert alle Werte",
    "rest:",
    `  - resource: ${basisUrl}/api/v1/home-assistant/sensoren`,
    "    headers:",
    "      Authorization: !secret tools_api_auth",
    "    scan_interval: 300",
    "    timeout: 20",
    "    sensor:",
    ...HA_SENSOREN.map(sensorYaml),
    "    binary_sensor:",
    '      - name: "Kalorienbudget überschritten"',
    "        unique_id: tools_ueber_budget",
    '        value_template: "{{ value_json.fitness.ueber_budget }}"',
    '        availability: "{{ value_json is defined and value_json.fitness.ueber_budget is not none }}"',
    "        icon: mdi:alert-circle-outline",
  ].join("\n");
}

export function haRestCommandYaml(basisUrl: string): string {
  const befehl = (name: string, pfad: string, methode: "POST" | "PUT", payload: string) =>
    [
      `  ${name}:`,
      `    url: ${basisUrl}/api/v1${pfad}`,
      `    method: ${methode}`,
      "    headers:",
      "      Authorization: !secret tools_api_auth",
      '    content_type: "application/json"',
      `    payload: '${payload}'`,
    ].join("\n");

  return [
    "# configuration.yaml — Werte aus Home Assistant zurückschreiben (Token mit Schreibzugriff nötig)",
    "rest_command:",
    befehl("tools_wasser", "/fitness/tageswerte/wasser", "POST", '{"ml": {{ ml | default(250) | int }}}'),
    befehl("tools_gewicht", "/fitness/gewicht", "POST", '{"gewichtKg": {{ gewicht | float }}}'),
    befehl("tools_schritte", "/fitness/tageswerte", "PUT", '{"schritte": {{ schritte | int }}}'),
    befehl(
      "tools_training",
      "/fitness/training",
      "POST",
      '{"sportart": "{{ sportart | default("SONSTIGES") }}", "dauerMin": {{ minuten | int }}, "notiz": "Home Assistant"}'
    ),
  ].join("\n");
}

export interface CurlBeispiel {
  titel: string;
  befehl: string;
}

export function curlBeispiele(basisUrl: string): CurlBeispiel[] {
  const api = `${basisUrl}/api/v1`;
  const auth = '-H "Authorization: Bearer $TOOLS_TOKEN"';
  const json = '-H "Content-Type: application/json"';
  return [
    { titel: "Token prüfen", befehl: `curl -s ${auth} ${api}/ich` },
    { titel: "Heutige Tagesübersicht", befehl: `curl -s ${auth} ${api}/fitness/tag` },
    { titel: "Gewicht eintragen (z. B. Smart-Waage)", befehl: `curl -s -X POST ${auth} ${json} -d '{"gewichtKg": 82.4}' ${api}/fitness/gewicht` },
    {
      titel: "Mahlzeit eintragen",
      befehl: `curl -s -X POST ${auth} ${json} -d '{"mahlzeit": "MITTAGESSEN", "bezeichnung": "Linsensuppe", "mengeG": 400, "kcal": 380, "proteinG": 22, "kohlenhydrateG": 48, "fettG": 8}' ${api}/fitness/mahlzeiten`,
    },
    {
      titel: "Foto analysieren und speichern (KI)",
      befehl: `curl -s -X POST ${auth} ${json} -d "{\\"bild\\": \\"$(base64 -w0 essen.jpg)\\", \\"mediaType\\": \\"image/jpeg\\", \\"speichern\\": true, \\"mahlzeit\\": \\"ABENDESSEN\\"}" ${api}/fitness/mahlzeiten/foto-analyse`,
    },
    { titel: "Glas Wasser (+250 ml)", befehl: `curl -s -X POST ${auth} ${json} -d '{"ml": 250}' ${api}/fitness/tageswerte/wasser` },
    { titel: "Statistik der letzten 30 Tage", befehl: `curl -s ${auth} "${api}/fitness/zeitraum?tage=30"` },
  ];
}
