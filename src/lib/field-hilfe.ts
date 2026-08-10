// Erklärtexte für die (i)-Tooltips an Formularfeldern. Zentral gepflegt,
// damit Formulierungen an einer Stelle konsistent bleiben.

export const FIELD_HILFE = {
  // Kaufnebenkosten
  grunderwerbsteuer:
    "Steuer beim Immobilienkauf, Höhe je Bundesland unterschiedlich (3,5–6,5%). Wird automatisch aus dem gewählten Bundesland vorgeschlagen, kannst du aber manuell überschreiben.",
  notar:
    "Beurkundung des Kaufvertrags durch den Notar, gesetzlich vorgeschrieben. Richtwert ca. 1–1,5% des Kaufpreises.",
  grundbuch:
    "Eintragung ins Grundbuch (Eigentumsumschreibung, ggf. Grundschuld für die Bank). Richtwert ca. 0,5% des Kaufpreises.",
  maklerprovision:
    "Falls ein Makler beteiligt war. Seit 2020 meist hälftig zwischen Käufer und Verkäufer geteilt. Auf 0 setzen (mit Override), falls kein Makler beteiligt war.",

  // Miete / laufende Kosten
  kaltmiete:
    "Die Miete ohne Nebenkosten (das, was du als Vermieter tatsächlich behältst). Nebenkosten werden separat über die Hausgeld-/Betriebskosten-Felder erfasst.",
  hausgeldUmlagefaehig:
    "Der Teil deines monatlichen Hausgelds (bzw. deiner Nebenkosten), den du über die Nebenkostenabrechnung an den Mieter weitergeben darfst: z. B. Wasser, Müll, Hausmeister (reine Hauswarttätigkeit), Gebäudereinigung, Aufzug, Gartenpflege. Wirkt sich NICHT auf deinen Cashflow aus, da der Mieter es erstattet.",
  hausgeldNichtUmlagefaehig:
    "Der Teil deines Hausgelds, den du als Eigentümer selbst tragen musst: vor allem Verwalterhonorar-Anteil und Instandhaltungsrücklagen-Zuführung. Bei einer WEG steht die Aufteilung im Wirtschaftsplan/in der Hausgeldabrechnung.",
  grundsteuer:
    "Jährliche Steuer ans Finanzamt, abhängig vom Hebesatz deiner Gemeinde. Ist voll umlagefähig auf den Mieter (wirkt sich daher nicht auf deinen Cashflow aus) — bei einer ETW bekommst du meist einen eigenen Bescheid, nicht über die WEG. Keine automatische Berechnung möglich, da der Hebesatz von Gemeinde zu Gemeinde stark schwankt.",
  instandhaltungsruecklage:
    "Rücklage für Reparaturen/Sanierung — bleibt IMMER beim Eigentümer, nie umlagefähig. Wird automatisch aus Baujahr und Zustand der Gewerke geschätzt (Peters'sche Formel), kann aber manuell überschrieben werden.",
  verwaltungskosten:
    "Honorar für die Hausverwaltung (WEG-Verwalter oder externe Mietverwaltung). Nicht umlagefähig auf den Mieter.",
  leerstandsquote:
    "Wie viel Prozent der Zeit die Wohnung im Schnitt leer stehen könnte (Mieterwechsel, Sanierung). Reduziert die effektive Jahresmiete in der Kalkulation.",
  versicherung:
    "Gebäude-/Sachversicherung. Kann je nach Mietvertrag umlagefähig sein oder nicht — mit dem Schalter daneben einstellbar. Ist sie umlagefähig, wirkt sie sich nicht auf deinen Cashflow aus.",
  versicherungUmlagefaehig:
    "An: die Versicherung wird wie umlagefähiges Hausgeld behandelt (Mieter erstattet sie, kein Effekt auf deinen Cashflow). Aus: du trägst die Kosten selbst.",

  // Steuer
  afaSatz:
    "Lineare Abschreibung für Abnutzung — jährlicher Prozentsatz vom Gebäudewert (ohne Grundstücksanteil), den du steuerlich als Werbungskosten geltend machen kannst. Standard: 2% (bzw. 2,5% bei Baujahr vor 1925).",
  afaSonderabschreibung:
    "Zusätzliche Sonderabschreibung für bestimmten Neubau (§7b EStG), sofern die Voraussetzungen erfüllt sind. Wirkt sich in dieser Kalkulation aktuell nicht auf die AfA-Berechnung aus — nur als Kennzeichnung erfasst.",
  grenzsteuersatz:
    "Der Steuersatz, mit dem der nächste Euro Einkommen versteuert wird — wichtig, weil er bestimmt, wie viel Steuer du auf Mietüberschuss zahlst bzw. wie viel du bei einem Verlust sparst. Wird aus deinem zu versteuernden Einkommen im Profil berechnet.",

  // Finanzierung
  finanzierungsart:
    "100%: Die Bank finanziert nur den Kaufpreis, du zahlst die Kaufnebenkosten aus Eigenkapital. 110%: Die Bank finanziert Kaufpreis UND Kaufnebenkosten mit. Manuell: du gibst deine eigene Eigenkapitalquote vor.",
  zinsbindung:
    "Zeitraum, für den der Zinssatz fest vereinbart ist. Danach ist eine Anschlussfinanzierung zu neuen (unbekannten) Konditionen nötig — im Chart als Marke sichtbar.",

  // Exit
  exitWertsteigerung:
    "Angenommene jährliche Wertsteigerung der Immobilie — reine Annahme deinerseits, keine Prognose.",

  // Profil
  bruttoEinkommen:
    "Dein Bruttogehalt vor Steuern und Sozialabgaben. Daraus wird eine grobe Schätzung des zu versteuernden Einkommens abgeleitet (Pauschbeträge für Werbungskosten, Sozialabgaben etc.) — für eine genauere Grenzsteuersatz-Berechnung kannst du das zu versteuernde Einkommen manuell überschreiben (z. B. aus deinem Steuerbescheid).",
  nettoEinkommen:
    "Was tatsächlich auf deinem Konto ankommt. Wird für dein verfügbares Budget und die Schuldendienstquote (Belastung durch Kreditraten) genutzt.",
  zvE:
    "Zu versteuerndes Einkommen — die Bemessungsgrundlage fürs Finanzamt, meist deutlich niedriger als dein Bruttogehalt. Ohne Override wird es aus dem Bruttoeinkommen grob geschätzt; für Genauigkeit trägst du am besten den echten Wert aus deinem letzten Steuerbescheid ein.",
  fixkosten:
    "Deine monatlichen Fixkosten (Miete, Versicherungen, Abos, laufende Ausgaben) — wird vom Netto-Einkommen abgezogen, um dein verfügbares Budget zu ermitteln.",
  maxSchuldendienstquote:
    "Maximaler Anteil deines Netto-Einkommens, der für alle Kreditraten zusammen (bestehende + neue Immobilie) drauf gehen darf, bevor die Ampel auf Rot springt.",
  mindestLiquiditaetsreserve:
    "Wie viel Eigenkapital nach dem Kauf mindestens übrig bleiben soll, als Puffer für Unvorhergesehenes.",
} as const;
