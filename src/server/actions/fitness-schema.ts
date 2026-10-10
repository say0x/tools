import { z } from "zod";
import { istIsoDatum } from "@/server/calc/fitness/datum";
import {
  AKTIVITAETSLEVEL,
  DATEN_QUELLEN,
  FITNESS_ZIELE,
  GESCHLECHTER,
  INTENSITAETEN,
  KI_KONFIDENZEN,
  MAHLZEITEN,
  SPORTARTEN,
} from "@/server/calc/fitness/types";

/**
 * Validierung für alle Fitness-Schreibwege — gemeinsam genutzt von den
 * Server Actions (UI) und der REST-API (/api/v1/fitness/*), damit beide Wege
 * exakt dieselben Grenzen erzwingen.
 */

const zahl = (feld: string) => z.number({ error: `${feld} muss eine Zahl sein` });

const datumSchema = z
  .string({ error: "Datum fehlt" })
  .refine(istIsoDatum, "Ungültiges Datum — erwartet wird JJJJ-MM-TT");

const nullableZahl = (feld: string, min: number, max: number, einheit = "") =>
  zahl(feld)
    .min(min, `${feld} muss mindestens ${min}${einheit} sein`)
    .max(max, `${feld} darf höchstens ${max}${einheit} sein`)
    .nullable();

export const fitnessProfilSchema = z.object({
  groesseCm: zahl("Größe").int("Größe in ganzen cm").min(100, "Größe muss zwischen 100 und 250 cm liegen").max(250, "Größe muss zwischen 100 und 250 cm liegen"),
  geburtsjahr: zahl("Geburtsjahr").int("Geburtsjahr muss ganzzahlig sein").min(1900, "Geburtsjahr ist unplausibel").max(2100, "Geburtsjahr ist unplausibel"),
  geschlecht: z.enum(GESCHLECHTER),
  aktivitaetslevel: z.enum(AKTIVITAETSLEVEL),
  ziel: z.enum(FITNESS_ZIELE),
  zielTempoKgProWoche: zahl("Tempo").min(0.1, "Tempo muss zwischen 0,1 und 1 kg/Woche liegen").max(1, "Mehr als 1 kg/Woche ist nicht empfehlenswert"),
  zielGewichtKg: nullableZahl("Zielgewicht", 30, 300, " kg"),
  kalorienzielKcal: zahl("Kalorienziel").int("Kalorienziel in ganzen kcal").min(800, "Kalorienziel muss mindestens 800 kcal sein").max(6000, "Kalorienziel darf höchstens 6000 kcal sein").nullable(),
  kalorienzielOverride: z.boolean(),
  proteinGProKg: zahl("Protein").min(0.8, "Protein muss zwischen 0,8 und 3 g/kg liegen").max(3, "Protein muss zwischen 0,8 und 3 g/kg liegen"),
  fettAnteilProzent: zahl("Fettanteil").min(15, "Fettanteil muss zwischen 15 und 50 % liegen").max(50, "Fettanteil muss zwischen 15 und 50 % liegen"),
  wasserZielMl: zahl("Wasserziel").int("Wasserziel in ganzen ml").min(500, "Wasserziel muss mindestens 500 ml sein").max(8000, "Wasserziel darf höchstens 8000 ml sein").nullable(),
  schritteZiel: zahl("Schritteziel").int("Schritteziel muss ganzzahlig sein").min(0, "Schritteziel darf nicht negativ sein").max(50_000, "Schritteziel ist unrealistisch hoch"),
  trainingskalorienAnrechnen: z.boolean(),
  /** Optional: legt/aktualisiert direkt den heutigen Gewichtseintrag mit an. */
  aktuellesGewichtKg: nullableZahl("Aktuelles Gewicht", 20, 400, " kg"),
});

export const gewichtSchema = z.object({
  datum: datumSchema,
  gewichtKg: zahl("Gewicht").min(20, "Gewicht muss zwischen 20 und 400 kg liegen").max(400, "Gewicht muss zwischen 20 und 400 kg liegen"),
  koerperfettProzent: nullableZahl("Körperfett", 2, 70, " %").optional().default(null),
  notiz: z.string().max(500, "Notiz ist zu lang (max. 500 Zeichen)").optional().default(""),
});

const naehrwerteSchema = z.object({
  kcal: zahl("Kalorien").min(0, "Kalorien dürfen nicht negativ sein").max(10_000, "Kalorien sind unrealistisch hoch"),
  proteinG: zahl("Protein").min(0, "Protein darf nicht negativ sein").max(1000, "Protein ist unrealistisch hoch").default(0),
  kohlenhydrateG: zahl("Kohlenhydrate").min(0, "Kohlenhydrate dürfen nicht negativ sein").max(1000, "Kohlenhydrate sind unrealistisch hoch").default(0),
  fettG: zahl("Fett").min(0, "Fett darf nicht negativ sein").max(1000, "Fett ist unrealistisch hoch").default(0),
});

export const mahlzeitSchema = naehrwerteSchema.extend({
  datum: datumSchema,
  mahlzeit: z.enum(MAHLZEITEN),
  bezeichnung: z.string().trim().min(1, "Bezeichnung fehlt").max(200, "Bezeichnung ist zu lang (max. 200 Zeichen)"),
  mengeG: nullableZahl("Menge", 0, 5000, " g").optional().default(null),
  quelle: z.enum(DATEN_QUELLEN).optional().default("MANUELL"),
  kiKonfidenz: z.enum(KI_KONFIDENZEN).nullable().optional().default(null),
});

export const trainingSchema = z.object({
  datum: datumSchema,
  sportart: z.enum(SPORTARTEN),
  intensitaet: z.enum(INTENSITAETEN).optional().default("MITTEL"),
  dauerMin: zahl("Dauer").int("Dauer in ganzen Minuten").min(1, "Dauer muss mindestens 1 Minute sein").max(1440, "Dauer darf höchstens 24 Stunden sein"),
  distanzKm: nullableZahl("Distanz", 0, 1000, " km").optional().default(null),
  kcalVerbrauch: nullableZahl("Verbrauch", 0, 10_000, " kcal").optional().default(null),
  kcalOverride: z.boolean().optional().default(false),
  durchschnittsPuls: zahl("Puls").int("Puls ganzzahlig").min(30, "Puls muss zwischen 30 und 250 liegen").max(250, "Puls muss zwischen 30 und 250 liegen").nullable().optional().default(null),
  notiz: z.string().max(500, "Notiz ist zu lang (max. 500 Zeichen)").optional().default(""),
});

/**
 * Teil-Update der Tageswerte: undefined = Feld unverändert lassen,
 * null = Wert löschen. So kann z. B. Home Assistant nur die Schritte
 * senden, ohne Wasser/Schlaf zu überschreiben.
 */
export const tagesAktivitaetSchema = z.object({
  datum: datumSchema,
  schritte: zahl("Schritte").int("Schritte ganzzahlig").min(0, "Schritte dürfen nicht negativ sein").max(200_000, "Schritte sind unrealistisch hoch").nullable().optional(),
  wasserMl: zahl("Wasser").int("Wasser in ganzen ml").min(0, "Wasser darf nicht negativ sein").max(20_000, "Wasser ist unrealistisch hoch").nullable().optional(),
  schlafStunden: nullableZahl("Schlaf", 0, 24, " h").optional(),
  ruhepuls: zahl("Ruhepuls").int("Ruhepuls ganzzahlig").min(20, "Ruhepuls muss zwischen 20 und 200 liegen").max(200, "Ruhepuls muss zwischen 20 und 200 liegen").nullable().optional(),
});

export const wasserHinzufuegenSchema = z.object({
  datum: datumSchema,
  ml: zahl("Menge").int("Menge in ganzen ml").min(-5000, "Menge ist unrealistisch").max(5000, "Menge ist unrealistisch"),
});

export const eigenesLebensmittelSchema = z.object({
  bezeichnung: z.string().trim().min(1, "Bezeichnung fehlt").max(200, "Bezeichnung ist zu lang (max. 200 Zeichen)"),
  kcalPro100g: zahl("Kalorien").min(0, "Kalorien dürfen nicht negativ sein").max(900, "Mehr als 900 kcal/100 g ist physikalisch kaum möglich"),
  proteinPro100g: zahl("Protein").min(0, "Protein darf nicht negativ sein").max(100, "Mehr als 100 g/100 g geht nicht"),
  kohlenhydratePro100g: zahl("Kohlenhydrate").min(0, "Kohlenhydrate dürfen nicht negativ sein").max(100, "Mehr als 100 g/100 g geht nicht"),
  fettPro100g: zahl("Fett").min(0, "Fett darf nicht negativ sein").max(100, "Mehr als 100 g/100 g geht nicht"),
  standardPortionG: zahl("Portion").min(1, "Portion muss mindestens 1 g sein").max(5000, "Portion ist unrealistisch groß"),
});

/** Lesbare Fehlermeldung aus einem Zod-Fehler (wie in den übrigen Actions). */
export function zodFehlertext(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join(" · ");
}
