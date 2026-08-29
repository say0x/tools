import { z } from "zod";
import { BESITZSTAENDE } from "@/lib/asset";

/// Deckt beide manuell erfassten Positionsarten der Finanzübersicht ab —
/// Wertpapierdepot (Aktien/ETF) und Tagesgeld. Beide teilen sich dieselbe
/// Formstruktur (Betrag + Rendite/Zins + optionaler Sparplan), nur die
/// Ziel-Tabelle unterscheidet sich je nach `art`.
export const SPARPOSITION_ARTEN = ["WERTPAPIERDEPOT", "TAGESGELD"] as const;
export type SparpositionArt = (typeof SPARPOSITION_ARTEN)[number];

// Exportiert, damit restore-schema.ts dieselben Wertebereiche für die
// Backup-Wiederherstellung wiederverwenden kann statt sie ein zweites Mal zu duplizieren.
export const sparpositionSchema = z.object({
  // Gesetzt für bestehende Positionen (Asset.id), fehlt bei neu angelegten Zeilen im Formular —
  // speichereFinanzuebersicht() nutzt das, um bestehende Positionen zu aktualisieren statt sie
  // zu löschen und neu anzulegen (siehe dortiger Kommentar).
  assetId: z.string().optional(),
  art: z.enum(SPARPOSITION_ARTEN),
  name: z.string().trim().min(1, "Bezeichnung fehlt").max(200, "Bezeichnung ist zu lang (max. 200 Zeichen)"),
  // Default BESITZE_ICH beim Anlegen einer neuen Position (anders als bei Immobilien) —
  // wer hier einen Betrag einträgt, meint damit i. d. R. echten Besitz, siehe src/lib/asset.ts.
  besitzstatus: z.enum(BESITZSTAENDE),
  betrag: z.number({ error: "Betrag muss eine Zahl sein" }).min(0, "Betrag darf nicht negativ sein").max(100_000_000, "Betrag ist unrealistisch hoch"),
  renditeProzentJaehrlich: z
    .number({ error: "Rendite/Zins muss eine Zahl sein" })
    .min(-50, "Rendite/Zins liegt außerhalb eines realistischen Bereichs")
    .max(50, "Rendite/Zins liegt außerhalb eines realistischen Bereichs"),
  sparplanBetragMonatlich: z.number({ error: "Sparrate muss eine Zahl sein" }).min(0, "Sparrate darf nicht negativ sein").max(1_000_000, "Sparrate ist unrealistisch hoch"),
  sparplanSteigerungProzentJaehrlich: z
    .number({ error: "Sparraten-Steigerung muss eine Zahl sein" })
    .min(0, "Sparraten-Steigerung darf nicht negativ sein")
    .max(100, "Sparraten-Steigerung liegt außerhalb eines realistischen Bereichs"),
});

export const finanzuebersichtSchema = z.object({
  bruttoEinkommenMonatlich: z
    .number({ error: "Brutto-Einkommen muss eine Zahl sein" })
    .min(0, "Brutto-Einkommen darf nicht negativ sein")
    .max(1_000_000, "Brutto-Einkommen ist unrealistisch hoch"),
  gehaltssteigerungProzentJaehrlich: z
    .number({ error: "Gehaltssteigerung muss eine Zahl sein" })
    .min(0, "Gehaltssteigerung darf nicht negativ sein")
    .max(100, "Gehaltssteigerung liegt außerhalb eines realistischen Bereichs"),
  inflationProzentJaehrlich: z
    .number({ error: "Inflationsrate muss eine Zahl sein" })
    .min(0, "Inflationsrate darf nicht negativ sein")
    .max(50, "Inflationsrate liegt außerhalb eines realistischen Bereichs"),
  sparpositionen: z.array(sparpositionSchema),
});

export type FinanzuebersichtFormValues = z.infer<typeof finanzuebersichtSchema>;
export type SparpositionFormValues = z.infer<typeof sparpositionSchema>;
