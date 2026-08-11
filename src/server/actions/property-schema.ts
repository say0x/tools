import { z } from "zod";
import {
  BUNDESLAENDER,
  EIGENTUMSTYPEN,
  FINANZIERUNGSARTEN,
  GEWERKE,
  LAGETYPEN,
  OBJEKTTYPEN,
  SANIERUNGSMODI,
  VERGLASUNGSARTEN,
} from "@/server/calc/types";

const gewerkSchema = z.object({
  gewerk: z.enum(GEWERKE),
  zustand: z.number({ error: "Zustand muss eine Zahl sein" }).int("Zustand muss ganzzahlig sein").min(1, "Zustand muss zwischen 1 und 6 liegen").max(6, "Zustand muss zwischen 1 und 6 liegen"),
  eigentumsTyp: z.enum(EIGENTUMSTYPEN),
  geschaetzteKostenOverride: z.number({ error: "Geschätzte Kosten müssen eine Zahl sein" })
    .min(0, "Geschätzte Kosten dürfen nicht negativ sein")
    .max(10_000_000, "Geschätzte Kosten sind unrealistisch hoch")
    .nullable()
    .optional(),
  kommentar: z.string().max(2000, "Kommentar ist zu lang (max. 2000 Zeichen)").optional(),
  baujahr: z.number({ error: "Baujahr muss eine Zahl sein" })
    .int("Baujahr muss ganzzahlig sein")
    .min(1700, "Baujahr muss zwischen 1700 und 2100 liegen")
    .max(2100, "Baujahr muss zwischen 1700 und 2100 liegen")
    .nullable()
    .optional(),
  verglasung: z.enum(VERGLASUNGSARTEN).nullable().optional(),
});

const financingSchema = z.object({
  eigenkapital: z.number({ error: "Eigenkapital muss eine Zahl sein" }).min(0, "Eigenkapital darf nicht negativ sein").max(100_000_000, "Eigenkapital ist unrealistisch hoch"),
  zinssatzProzent: z.number({ error: "Zinssatz muss eine Zahl sein" }).min(0, "Zinssatz darf nicht negativ sein").max(20, "Zinssatz darf maximal 20% betragen"),
  anfaenglicheTilgungProzent: z.number({ error: "Tilgung muss eine Zahl sein" })
    .min(0, "Tilgung darf nicht negativ sein")
    .max(20, "Anfängliche Tilgung darf maximal 20% betragen"),
  zinsbindungJahre: z.number({ error: "Zinsbindung muss eine Zahl sein" })
    .int("Zinsbindung muss ganzzahlig sein")
    .min(1, "Zinsbindung muss mindestens 1 Jahr betragen")
    .max(50, "Zinsbindung darf maximal 50 Jahre betragen"),
  finanzierungsart: z.enum(FINANZIERUNGSARTEN),
  eigenkapitalquoteManuellProzent: z.number({ error: "EK-Quote muss eine Zahl sein" })
    .min(0, "EK-Quote darf nicht negativ sein")
    .max(100, "EK-Quote darf maximal 100% betragen")
    .nullable()
    .optional(),
});

const exitSchema = z.object({
  geplant: z.boolean(),
  haltedauerJahre: z.number({ error: "Haltedauer muss eine Zahl sein" })
    .int("Haltedauer muss ganzzahlig sein")
    .min(1, "Haltedauer muss mindestens 1 Jahr betragen")
    .max(100, "Haltedauer darf maximal 100 Jahre betragen"),
});

export const propertySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name fehlt")
    .max(200, "Name ist zu lang (max. 200 Zeichen)"),
  kaufpreis: z.number({ error: "Kaufpreis muss eine Zahl sein" }).min(1, "Kaufpreis muss größer als 0 sein").max(100_000_000, "Kaufpreis ist unrealistisch hoch"),
  wohnflaeche: z.number({ error: "Wohnfläche muss eine Zahl sein" }).min(1, "Wohnfläche muss mindestens 1 m² betragen").max(100_000, "Wohnfläche ist unrealistisch groß"),
  bundesland: z.enum(BUNDESLAENDER),
  lagetyp: z.enum(LAGETYPEN),
  objekttyp: z.enum(OBJEKTTYPEN),
  baujahr: z.number({ error: "Baujahr muss eine Zahl sein" })
    .int("Baujahr muss ganzzahlig sein")
    .min(1700, "Baujahr muss zwischen 1700 und 2100 liegen")
    .max(2100, "Baujahr muss zwischen 1700 und 2100 liegen"),
  anzahlEinheiten: z.number({ error: "Anzahl Einheiten muss eine Zahl sein" })
    .int("Anzahl Einheiten muss ganzzahlig sein")
    .min(1, "Anzahl Einheiten muss mindestens 1 sein")
    .max(1000, "Anzahl Einheiten ist unrealistisch hoch"),

  grunderwerbsteuerProzent: z.number({ error: "Grunderwerbsteuer muss eine Zahl sein" }).min(0, "Grunderwerbsteuer darf nicht negativ sein").max(20, "Grunderwerbsteuer darf maximal 20% betragen"),
  grunderwerbsteuerOverride: z.boolean(),
  notarProzent: z.number({ error: "Notar-Satz muss eine Zahl sein" }).min(0, "Notar-Satz darf nicht negativ sein").max(10, "Notar-Satz darf maximal 10% betragen"),
  notarOverride: z.boolean(),
  grundbuchProzent: z.number({ error: "Grundbuch-Satz muss eine Zahl sein" }).min(0, "Grundbuch-Satz darf nicht negativ sein").max(10, "Grundbuch-Satz darf maximal 10% betragen"),
  grundbuchOverride: z.boolean(),
  maklerprovisionProzent: z.number({ error: "Maklerprovision muss eine Zahl sein" }).min(0, "Maklerprovision darf nicht negativ sein").max(20, "Maklerprovision darf maximal 20% betragen"),
  maklerprovisionOverride: z.boolean(),

  sanierungsmodus: z.enum(SANIERUNGSMODI),
  sofortinvestitionPauschal: z.number({ error: "Sofortinvestition muss eine Zahl sein" }).min(0, "Sofortinvestition darf nicht negativ sein").max(10_000_000, "Sofortinvestition ist unrealistisch hoch"),

  kaltmieteMonatlich: z.number({ error: "Kaltmiete muss eine Zahl sein" }).min(0, "Kaltmiete darf nicht negativ sein").max(1_000_000, "Kaltmiete ist unrealistisch hoch"),
  mietsteigerungProzentJaehrlich: z.number({ error: "Mietsteigerung muss eine Zahl sein" }).min(-20, "Mietsteigerung liegt außerhalb eines realistischen Bereichs").max(50, "Mietsteigerung liegt außerhalb eines realistischen Bereichs"),

  wertsteigerungProzentJaehrlich: z.number({ error: "Wertsteigerung muss eine Zahl sein" }).min(-20, "Wertsteigerung liegt außerhalb eines realistischen Bereichs").max(50, "Wertsteigerung liegt außerhalb eines realistischen Bereichs"),
  kostensteigerungProzentJaehrlich: z.number({ error: "Kostensteigerung muss eine Zahl sein" }).min(-20, "Kostensteigerung liegt außerhalb eines realistischen Bereichs").max(50, "Kostensteigerung liegt außerhalb eines realistischen Bereichs"),

  hausgeldUmlagefaehigMonatlich: z.number({ error: "Hausgeld umlagefähig muss eine Zahl sein" }).min(0, "Hausgeld umlagefähig darf nicht negativ sein").max(100_000, "Hausgeld umlagefähig ist unrealistisch hoch"),
  hausgeldNichtUmlagefaehigMonatlich: z.number({ error: "Hausgeld nicht umlagefähig muss eine Zahl sein" })
    .min(0, "Hausgeld nicht umlagefähig darf nicht negativ sein")
    .max(100_000, "Hausgeld nicht umlagefähig ist unrealistisch hoch"),
  grundsteuerJaehrlich: z.number({ error: "Grundsteuer muss eine Zahl sein" }).min(0, "Grundsteuer darf nicht negativ sein").max(1_000_000, "Grundsteuer ist unrealistisch hoch"),
  instandhaltungsruecklageMonatlich: z.number({ error: "Instandhaltungsrücklage muss eine Zahl sein" })
    .min(0, "Instandhaltungsrücklage darf nicht negativ sein")
    .max(100_000, "Instandhaltungsrücklage ist unrealistisch hoch"),
  instandhaltungsruecklageOverride: z.boolean(),
  verwaltungskostenMonatlich: z.number({ error: "Verwaltungskosten müssen eine Zahl sein" }).min(0, "Verwaltungskosten dürfen nicht negativ sein").max(100_000, "Verwaltungskosten sind unrealistisch hoch"),
  leerstandsquoteProzent: z.number({ error: "Leerstandsquote muss eine Zahl sein" }).min(0, "Leerstandsquote darf nicht negativ sein").max(100, "Leerstandsquote darf maximal 100% betragen"),
  versicherungJaehrlich: z.number({ error: "Versicherung muss eine Zahl sein" }).min(0, "Versicherung darf nicht negativ sein").max(1_000_000, "Versicherung ist unrealistisch hoch"),
  versicherungUmlagefaehig: z.boolean(),

  afaSatzProzent: z.number({ error: "AfA-Satz muss eine Zahl sein" }).min(0, "AfA-Satz darf nicht negativ sein").max(100, "AfA-Satz darf maximal 100% betragen"),
  afaSonderabschreibung: z.boolean(),

  ansprechpartnerName: z.string().trim().max(200, "Name ist zu lang (max. 200 Zeichen)"),
  ansprechpartnerTelefon: z.string().trim().max(50, "Telefonnummer ist zu lang (max. 50 Zeichen)"),
  ansprechpartnerEmail: z.union([z.email("E-Mail-Adresse ist ungültig"), z.literal("")]),
  ansprechpartnerNotizen: z.string().max(2000, "Notizen sind zu lang (max. 2000 Zeichen)"),

  financing: financingSchema,
  gewerke: z.array(gewerkSchema),
  exit: exitSchema,
});

export type PropertyFormValues = z.infer<typeof propertySchema>;
