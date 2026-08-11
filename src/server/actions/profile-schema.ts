import { z } from "zod";

const liabilitySchema = z.object({
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
  liabilities: z.array(liabilitySchema),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
