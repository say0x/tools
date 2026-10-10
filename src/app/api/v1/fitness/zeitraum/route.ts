import { apiRoute, datumParameter, ganzzahlParameter, jsonAntwort } from "@/server/api/handler";
import { eineStelle, ganz } from "@/server/api/dto";
import { ladeFitnessZeitraum } from "@/server/data/fitness";

export const dynamic = "force-dynamic";

/** Statistik und Tageswerte über einen Zeitraum. ?bis=JJJJ-MM-TT (Default heute) &tage=7 (1–366). */
export const GET = apiRoute({}, async (k, request) => {
  const bis = datumParameter(request, "bis", k.heute);
  const tage = ganzzahlParameter(request, "tage", 7, 1, 366);
  const z = await ladeFitnessZeitraum(k.userId, bis, tage);
  const s = z.statistik;
  const n = (v: number | null) => (v == null ? null : ganz(v));
  return jsonAntwort({
    bis,
    tage,
    statistik: {
      tageMitErnaehrung: s.tageMitErnaehrung,
      tageImZielkorridor: s.tageImZielkorridor,
      durchschnittKcal: n(s.durchschnittKcal),
      durchschnittProteinG: s.durchschnittProteinG == null ? null : eineStelle(s.durchschnittProteinG),
      durchschnittBudget: n(s.durchschnittBudget),
      bilanzKcal: ganz(s.bilanzKcal),
      rechnerischeVeraenderungKg: Math.round(s.rechnerischeVeraenderungKg * 100) / 100,
      trainingAnzahl: s.trainingAnzahl,
      trainingMinuten: s.trainingMinuten,
      trainingKcal: ganz(s.trainingKcal),
      durchschnittSchritte: n(s.durchschnittSchritte),
      durchschnittWasserMl: n(s.durchschnittWasserMl),
      durchschnittSchlafStunden: s.durchschnittSchlafStunden == null ? null : eineStelle(s.durchschnittSchlafStunden),
    },
    tageswerte: z.tage.map((t) => ({
      datum: t.datum,
      kcal: t.zugefuehrt ? ganz(t.zugefuehrt.kcal) : null,
      proteinG: t.zugefuehrt ? eineStelle(t.zugefuehrt.proteinG) : null,
      budget: t.budget > 0 ? ganz(t.budget) : null,
      trainingMinuten: t.trainingMinuten,
      trainingKcal: ganz(t.trainingKcal),
      schritte: t.aktivitaet?.schritte ?? null,
      wasserMl: t.aktivitaet?.wasserMl ?? null,
      schlafStunden: t.aktivitaet?.schlafStunden ?? null,
    })),
  });
});
