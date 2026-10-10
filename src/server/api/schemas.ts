import { z } from "zod";
import { MAHLZEITEN } from "@/server/calc/fitness/types";
import { istIsoDatum } from "@/server/calc/fitness/datum";

/** Request-Schemas, die nur die REST-API kennt (alle übrigen kommen aus actions/fitness-schema.ts). */

export const fotoAnalyseSchema = z.object({
  bild: z.string({ error: "Feld 'bild' fehlt (Data-URL oder Base64)" }).min(100, "Bild ist leer"),
  mediaType: z.string().optional(),
  hinweis: z.string().max(500).optional(),
  speichern: z.boolean().optional().default(false),
  mahlzeit: z.enum(MAHLZEITEN).optional().default("SNACK"),
  datum: z.string().refine(istIsoDatum, "Datum muss JJJJ-MM-TT sein").optional(),
});
