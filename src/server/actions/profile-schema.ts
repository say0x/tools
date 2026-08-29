import { z } from "zod";
import { BUNDESLAENDER } from "@/server/calc/types";

export const BESCHAEFTIGUNGSSTATUS = ["ANGESTELLT", "SELBSTSTAENDIG"] as const;

const liabilitySchema = z.object({
  // null bei neu hinzugefügten Krediten (noch kein DB-Eintrag) — steuert in
  // upsertProfile(), ob eine bestehende Zeile aktualisiert oder eine neue
  // angelegt wird, statt bei jedem Speichern alle Kredite zu löschen und mit
  // neuen IDs neu anzulegen (das Muster, das bei den Sparpositionen der
  // Finanzübersicht schon einmal zu kaskadierendem Datenverlust führte).
  id: z.string().nullable(),
  bezeichnung: z.string().trim().min(1, "Bezeichnung fehlt").max(200, "Bezeichnung ist zu lang (max. 200 Zeichen)"),
  monatlicheRate: z.number({ error: "Rate muss eine Zahl sein" }).min(0, "Rate darf nicht negativ sein").max(1_000_000, "Rate ist unrealistisch hoch"),
  restschuld: z.number({ error: "Restschuld muss eine Zahl sein" }).min(0, "Restschuld darf nicht negativ sein").max(100_000_000, "Restschuld ist unrealistisch hoch"),
});

export const profileSchema = z.object({
  nettoEinkommenMonatlich: z.number({ error: "Netto-Einkommen muss eine Zahl sein" }).min(0, "Netto-Einkommen darf nicht negativ sein").max(1_000_000, "Netto-Einkommen ist unrealistisch hoch"),
  bruttoEinkommenMonatlich: z.number({ error: "Brutto-Einkommen muss eine Zahl sein" }).min(0, "Brutto-Einkommen darf nicht negativ sein").max(1_000_000, "Brutto-Einkommen ist unrealistisch hoch"),
  zuVersteuerndesEinkommenJaehrlich: z
    .number({ error: "Zu versteuerndes Einkommen muss eine Zahl sein" })
    .min(0, "Zu versteuerndes Einkommen darf nicht negativ sein")
    .max(10_000_000, "Zu versteuerndes Einkommen ist unrealistisch hoch"),
  zvEOverride: z.boolean(),
  fixkostenMonatlich: z.number({ error: "Fixkosten müssen eine Zahl sein" }).min(0, "Fixkosten dürfen nicht negativ sein").max(1_000_000, "Fixkosten sind unrealistisch hoch"),
  vorhandenesEigenkapital: z.number({ error: "Eigenkapital muss eine Zahl sein" }).min(0, "Eigenkapital darf nicht negativ sein").max(100_000_000, "Eigenkapital ist unrealistisch hoch"),
  maxSchuldendienstquoteProzent: z
    .number({ error: "Schuldendienstquote muss eine Zahl sein" })
    .min(0, "Schuldendienstquote darf nicht negativ sein")
    .max(100, "Schuldendienstquote darf maximal 100% betragen"),
  mindestLiquiditaetsreserveEuro: z
    .number({ error: "Liquiditätsreserve muss eine Zahl sein" })
    .min(0, "Liquiditätsreserve darf nicht negativ sein")
    .max(100_000_000, "Liquiditätsreserve ist unrealistisch hoch"),
  mietanrechnungProzent: z
    .number({ error: "Mietanrechnung muss eine Zahl sein" })
    .min(0, "Mietanrechnung darf nicht negativ sein")
    .max(100, "Mietanrechnung darf maximal 100% betragen"),
  mindestEigenkapitalrenditeProzent: z
    .number({ error: "Mindest-EK-Rendite muss eine Zahl sein" })
    .min(-100, "Mindest-EK-Rendite liegt außerhalb eines realistischen Bereichs")
    .max(100, "Mindest-EK-Rendite liegt außerhalb eines realistischen Bereichs"),
  eigenkapitalPruefungAbEuro: z
    .number({ error: "Prüfschwelle muss eine Zahl sein" })
    .min(0, "Prüfschwelle darf nicht negativ sein")
    .max(100_000_000, "Prüfschwelle ist unrealistisch hoch"),
  cashflowStartverlustMaxProzentKaltmiete: z
    .number({ error: "Startverlust-Grenze muss eine Zahl sein" })
    .min(0, "Startverlust-Grenze darf nicht negativ sein")
    .max(100, "Startverlust-Grenze darf maximal 100% betragen"),
  cashflowUmschlagjahr: z
    .number({ error: "Umschlagjahr muss eine Zahl sein" })
    .int("Umschlagjahr muss eine ganze Zahl sein")
    .min(1, "Umschlagjahr muss mindestens 1 sein")
    .max(50, "Umschlagjahr darf höchstens 50 sein"),
  liabilities: z.array(liabilitySchema),

  // Für den Steuerrechner (Solidaritätszuschlag, Kirchensteuer, Sozialabgaben) —
  // siehe Kommentar bei den gleichnamigen Feldern in schema.prisma.
  bundesland: z.enum(BUNDESLAENDER),
  kirchensteuerpflichtig: z.boolean(),
  beschaeftigungsstatus: z.enum(BESCHAEFTIGUNGSSTATUS),
  gesetzlichKrankenversichert: z.boolean(),
  kinderlos: z.boolean(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
