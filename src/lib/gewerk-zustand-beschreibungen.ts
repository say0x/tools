import type { Gewerk } from "@/server/calc/types";

/**
 * Kurzbeschreibung, was Zustand 1–6 bei diesem konkreten Gewerk praktisch
 * bedeutet — ergänzt die generischen Zustand-Labels ("1 — sehr gut" etc.)
 * um gewerkspezifische Anhaltspunkte für die Einschätzung bei Besichtigungen.
 */
export const GEWERK_ZUSTAND_BESCHREIBUNG: Record<Gewerk, Record<number, string>> = {
  DACH: {
    1: "Neu eingedeckt oder unter 5 Jahre alt, keine sichtbaren Mängel, Dämmung entspricht aktuellem Standard.",
    2: "Eindeckung intakt, keine akuten Mängel, allenfalls kleinere Wartungsarbeiten in den nächsten Jahren.",
    3: "Funktionsfähig, aber erste Alterserscheinungen (poröse Ziegel, verwitterte Dachrinnen) — mittelfristig Instandsetzung sinnvoll.",
    4: "Sichtbare Mängel (einzelne undichte Stellen, Moosbewuchs, veraltete Dämmung), zeitnahe Sanierung empfehlenswert.",
    5: "Undichtigkeiten und deutliche Mängel an Eindeckung/Dämmung, kurzfristiger Handlungsbedarf.",
    6: "Dach akut sanierungsbedürftig oder undicht, Vollsanierung bzw. Neueindeckung erforderlich.",
  },
  FENSTER: {
    1: "Neuwertig, moderne Mehrfachverglasung, dichte Rahmen, aktueller Energiestandard.",
    2: "Guter Zustand, funktionstüchtig, keine nennenswerten Mängel an Dichtungen oder Rahmen.",
    3: "Funktionsfähig, aber ältere Verglasung/Rahmen, erste Abnutzung an Dichtungen erkennbar.",
    4: "Deutliche Abnutzung, Zugluft oder Kondenswasser möglich — Austausch mittelfristig sinnvoll.",
    5: "Undichte Fenster, veraltete Verglasung, spürbare Energieverluste — zeitnaher Austausch empfehlenswert.",
    6: "Fenster stark beschädigt oder funktionsuntüchtig, kompletter Austausch erforderlich.",
  },
  HEIZUNG: {
    1: "Neue, hocheffiziente Anlage (unter 5 Jahre), entspricht aktuellem Stand der Technik.",
    2: "Guter, gewarteter Zustand, keine Auffälligkeiten, mittlere Restlaufzeit.",
    3: "Funktionstüchtig, aber älter, mit absehbar begrenzter Restlaufzeit.",
    4: "Ältere Anlage mit erhöhtem Wartungsaufwand oder ineffizienter Technik — Erneuerung mittelfristig ratsam.",
    5: "Störanfällig oder deutlich veraltet (z. B. Heizkessel ohne Brennwerttechnik) — Austausch zeitnah nötig.",
    6: "Anlage defekt, ausgefallen oder am Ende der Lebensdauer, sofortiger Austausch erforderlich.",
  },
  ELEKTRIK: {
    1: "Neuinstallation nach aktueller Norm (z. B. mit FI-Schutzschaltern, ausreichend Stromkreisen).",
    2: "Guter Zustand, entspricht weitgehend den heutigen Anforderungen.",
    3: "Funktionstüchtig, aber teilweise älter (z. B. begrenzte Anzahl Steckdosen/Stromkreise) — Modernisierung mittelfristig sinnvoll.",
    4: "Veraltete Installation (z. B. keine FI-Schutzschaltung), erhöhter Anpassungsbedarf.",
    5: "Deutlich veraltet oder mit Sicherheitsmängeln (z. B. alte Aluminiumleitungen, fehlende Absicherung) — zeitnahe Erneuerung nötig.",
    6: "Elektrik akut sicherheitskritisch oder komplett veraltet, vollständige Neuinstallation erforderlich.",
  },
  SANITAER_BAEDER: {
    1: "Neuwertige Bäder/Sanitäranlagen, moderne Ausstattung, aktuelle Leitungstechnik.",
    2: "Guter Zustand, funktionstüchtig, keine akuten Mängel.",
    3: "Funktionsfähig, aber optisch/technisch in die Jahre gekommen — Modernisierung mittelfristig empfehlenswert.",
    4: "Deutliche Gebrauchsspuren, veraltete Ausstattung oder Leitungen — Sanierung mittelfristig nötig.",
    5: "Sanierungsbedürftig (z. B. alte Rohrleitungen, defekte Armaturen), zeitnaher Handlungsbedarf.",
    6: "Bäder/Sanitär akut sanierungsbedürftig oder unbenutzbar, Vollsanierung erforderlich.",
  },
  MAUERWERK_FASSADE: {
    1: "Neuwertig oder frisch saniert, keine sichtbaren Schäden, intakte Fassadendämmung.",
    2: "Guter Zustand, kleinere optische Mängel möglich, keine strukturellen Probleme.",
    3: "Funktionsfähig, aber mit ersten Alterserscheinungen (Risse im Putz, verwitterte Fassade).",
    4: "Sichtbare Schäden (Risse, Feuchtigkeitsspuren) — Instandsetzung mittelfristig empfehlenswert.",
    5: "Deutliche Mängel (Feuchtigkeitsschäden, größere Risse), zeitnahe Sanierung nötig.",
    6: "Substanzielle Schäden am Mauerwerk (z. B. Feuchtigkeit, Statikprobleme), umfassende Sanierung erforderlich.",
  },
  BODENBELAEGE: {
    1: "Neuwertige Böden, moderne, hochwertige Beläge ohne Gebrauchsspuren.",
    2: "Guter Zustand, keine nennenswerten Mängel oder Abnutzung.",
    3: "Funktionsfähig, aber mit sichtbaren Gebrauchsspuren — Erneuerung mittelfristig sinnvoll.",
    4: "Deutliche Abnutzung oder veraltete Beläge — Austausch mittelfristig empfehlenswert.",
    5: "Stark abgenutzte oder beschädigte Böden, zeitnaher Austausch nötig.",
    6: "Böden akut sanierungsbedürftig oder beschädigt (z. B. Wasserschaden), vollständiger Austausch erforderlich.",
  },
  SONSTIGES: {
    1: "Neuwertig, keine erkennbaren Mängel.",
    2: "Guter Zustand, keine akuten Mängel.",
    3: "Funktionsfähig, mit ersten Alterserscheinungen.",
    4: "Deutliche Abnutzung, Instandsetzung mittelfristig sinnvoll.",
    5: "Sanierungsbedürftig, zeitnaher Handlungsbedarf.",
    6: "Akut sanierungsbedürftig oder funktionsuntüchtig, sofortige Maßnahmen nötig.",
  },
};
