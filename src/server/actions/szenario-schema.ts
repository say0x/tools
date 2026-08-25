import { z } from "zod";
import { VERMOEGENSVERLAUF_MAX_JAHRE } from "@/server/calc/constants";

/// Deckt alle vier Änderungsarten des Szenario-Systems in einer flachen
/// Struktur ab (analog zum Sparposition-Muster in finanzuebersicht-schema.ts)
/// — welche Felder Pflicht sind, hängt vom `typ` ab (siehe superRefine unten).
export const SZENARIO_AENDERUNG_TYPEN = [
  "IMMOBILIE_AUFNEHMEN",
  "IMMOBILIE_VERKAUFEN",
  "SPARRATE_AENDERN",
  "EINMALIGE_ANSCHAFFUNG",
] as const;
export type SzenarioAenderungTyp = (typeof SZENARIO_AENDERUNG_TYPEN)[number];

const aenderungSchema = z
  .object({
    typ: z.enum(SZENARIO_AENDERUNG_TYPEN),
    assetId: z.string().nullable(),
    neueSparrateMonatlich: z
      .number({ error: "Sparrate muss eine Zahl sein" })
      .min(0, "Sparrate darf nicht negativ sein")
      .max(1_000_000, "Sparrate ist unrealistisch hoch")
      .nullable(),
    jahrAbHeute: z
      .number({ error: "Jahr muss eine Zahl sein" })
      .int("Jahr muss ganzzahlig sein")
      .min(0, "Jahr darf nicht in der Vergangenheit liegen")
      // Muss mit VERMOEGENSVERLAUF_MAX_JAHRE übereinstimmen: darüber hinaus ist im
      // Vermögensverlauf/Chart nichts mehr berechenbar oder sichtbar — eine Änderung mit
      // einem größeren Jahr würde sich speichern lassen, aber nie sichtbar wirken.
      .max(VERMOEGENSVERLAUF_MAX_JAHRE, `Jahr darf höchstens ${VERMOEGENSVERLAUF_MAX_JAHRE} betragen`)
      .nullable(),
    bezeichnung: z.string().trim().max(200, "Bezeichnung ist zu lang (max. 200 Zeichen)").nullable(),
    betrag: z.number({ error: "Betrag muss eine Zahl sein" }).min(0, "Betrag darf nicht negativ sein").max(100_000_000, "Betrag ist unrealistisch hoch").nullable(),
  })
  .superRefine((data, ctx) => {
    if (
      (data.typ === "IMMOBILIE_AUFNEHMEN" || data.typ === "IMMOBILIE_VERKAUFEN" || data.typ === "SPARRATE_AENDERN") &&
      !data.assetId
    ) {
      ctx.addIssue({ code: "custom", path: ["assetId"], message: "Bitte ein Objekt auswählen" });
    }
    if (data.typ === "IMMOBILIE_VERKAUFEN" && data.jahrAbHeute == null) {
      ctx.addIssue({ code: "custom", path: ["jahrAbHeute"], message: "Bitte das Verkaufsjahr angeben" });
    }
    if (data.typ === "SPARRATE_AENDERN" && data.neueSparrateMonatlich == null) {
      ctx.addIssue({ code: "custom", path: ["neueSparrateMonatlich"], message: "Bitte die neue Sparrate angeben" });
    }
    if (data.typ === "EINMALIGE_ANSCHAFFUNG") {
      if (!data.bezeichnung) ctx.addIssue({ code: "custom", path: ["bezeichnung"], message: "Bitte eine Bezeichnung angeben" });
      if (data.betrag == null) ctx.addIssue({ code: "custom", path: ["betrag"], message: "Bitte einen Betrag angeben" });
      if (data.jahrAbHeute == null) ctx.addIssue({ code: "custom", path: ["jahrAbHeute"], message: "Bitte das Jahr angeben" });
    }
  });

export const szenarioSchema = z.object({
  name: z.string().trim().min(1, "Name fehlt").max(200, "Name ist zu lang (max. 200 Zeichen)"),
  startjahr: z
    .number({ error: "Startjahr muss eine Zahl sein" })
    .int("Startjahr muss ganzzahlig sein")
    .min(1900, "Startjahr liegt außerhalb eines realistischen Bereichs")
    .max(2200, "Startjahr liegt außerhalb eines realistischen Bereichs"),
  notizen: z.string().max(2000, "Notizen sind zu lang (max. 2000 Zeichen)"),
  aenderungen: z.array(aenderungSchema),
});

export type SzenarioFormValues = z.infer<typeof szenarioSchema>;
export type SzenarioAenderungFormValues = SzenarioFormValues["aenderungen"][number];
