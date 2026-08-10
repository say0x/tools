// Zonenwerte des deutschen Einkommensteuertarifs (§32a EStG), Jahr für Jahr
// gepflegt, damit jährliche Gesetzesänderungen nur eine neue Tabellenzeile
// statt einer Formel-Änderung brauchen.
//
// WICHTIG: Werte vor produktivem Einsatz gegen die aktuelle BMF-Veröffentlichung
// verifizieren — Steuerjahre ohne Eintrag fallen auf das jüngste bekannte Jahr
// zurück (siehe grenzsteuersatz.ts), was für eine grobe Näherung reicht, aber
// keine Steuerberatung ersetzt.

export interface EstgZone {
  grundfreibetrag: number;
  zone2Ende: number;
  zone3Ende: number;
  zone4Ende: number; // Reichensteuer-Schwelle
  zone2: { a: number; b: number };
  zone3: { a: number; b: number; c: number };
  zone4: { satz: number; abzug: number };
  zone5: { satz: number; abzug: number };
}

export const ESTG_ZONEN: Record<number, EstgZone> = {
  2024: {
    grundfreibetrag: 11604,
    zone2Ende: 17005,
    zone3Ende: 66760,
    zone4Ende: 277825,
    zone2: { a: 954.8, b: 1400 },
    zone3: { a: 181.19, b: 2397, c: 1025.38 },
    zone4: { satz: 0.42, abzug: 10602.13 },
    zone5: { satz: 0.45, abzug: 18936.88 },
  },
  2025: {
    grundfreibetrag: 12096,
    zone2Ende: 17443,
    zone3Ende: 68480,
    zone4Ende: 277825,
    zone2: { a: 932.3, b: 1400 },
    zone3: { a: 176.64, b: 2397, c: 1015.13 },
    zone4: { satz: 0.42, abzug: 10911.92 },
    zone5: { satz: 0.45, abzug: 19246.67 },
  },
};

export function resolveEstgZone(jahr: number): { jahr: number; zone: EstgZone } {
  if (ESTG_ZONEN[jahr]) return { jahr, zone: ESTG_ZONEN[jahr] };
  const jahre = Object.keys(ESTG_ZONEN).map(Number).sort((a, b) => a - b);
  const naechstes = jahre.filter((j) => j <= jahr).pop() ?? jahre[jahre.length - 1];
  return { jahr: naechstes, zone: ESTG_ZONEN[naechstes] };
}
