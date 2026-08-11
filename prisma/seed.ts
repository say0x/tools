import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Bundesland, Lagetyp, Gewerk, Objekttyp } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Alle Werte in dieser Datei sind Startwerte/Platzhalter, keine Live-Daten.
// Sie sind über die Referenzdaten-Seite im UI jederzeit editierbar. Vor
// produktivem Einsatz insbesondere die Grunderwerbsteuersätze gegen eine
// aktuelle Quelle prüfen (ändern sich per Landesgesetz).

const grunderwerbsteuer: Record<Bundesland, number> = {
  BAYERN: 3.5,
  SACHSEN: 5.5,
  HAMBURG: 5.5,
  BADEN_WUERTTEMBERG: 5.0,
  BREMEN: 5.0,
  NIEDERSACHSEN: 5.0,
  RHEINLAND_PFALZ: 5.0,
  SACHSEN_ANHALT: 5.0,
  THUERINGEN: 5.0,
  BERLIN: 6.0,
  HESSEN: 6.0,
  MECKLENBURG_VORPOMMERN: 6.0,
  BRANDENBURG: 6.5,
  NORDRHEIN_WESTFALEN: 6.5,
  SAARLAND: 6.5,
  SCHLESWIG_HOLSTEIN: 6.5,
};

// Grober Großstadt-Mietpreis-Richtwert (€/m² kalt) je Bundesland; Kleinstadt/
// ländlich werden relativ dazu gestaffelt. Reine Platzhalter zum Vergleichen,
// keine echte Mietspiegel-Anbindung.
const grossstadtMietpreis: Record<Bundesland, number> = {
  BAYERN: 14.5,
  HAMBURG: 13.5,
  BERLIN: 12.5,
  BADEN_WUERTTEMBERG: 12.5,
  HESSEN: 12.0,
  BREMEN: 10.0,
  NORDRHEIN_WESTFALEN: 10.5,
  NIEDERSACHSEN: 9.5,
  RHEINLAND_PFALZ: 9.5,
  SCHLESWIG_HOLSTEIN: 10.0,
  SAARLAND: 8.5,
  BRANDENBURG: 9.5,
  MECKLENBURG_VORPOMMERN: 8.5,
  SACHSEN: 8.5,
  SACHSEN_ANHALT: 7.5,
  THUERINGEN: 7.5,
};

const lagetypFaktor: Record<Lagetyp, number> = {
  GROSSSTADT: 1.0,
  KLEINSTADT: 0.8,
  LAENDLICH: 0.6,
};

const gewerkKosten: Record<Gewerk, { min: number; max: number }> = {
  DACH: { min: 150, max: 250 },
  HEIZUNG: { min: 100, max: 180 },
  FENSTER: { min: 80, max: 150 },
  ELEKTRIK: { min: 60, max: 120 },
  SANITAER_BAEDER: { min: 400, max: 800 },
  MAUERWERK_FASSADE: { min: 100, max: 200 },
  BODENBELAEGE: { min: 40, max: 80 },
  SONSTIGES: { min: 50, max: 100 },
};

// Vergleichs-Kaufpreisfaktor je Objekttyp/Lagetyp — grober Richtwert für die
// Verhandlungsargumente, keine Marktdaten. Bruttomietrendite ergibt sich als
// Kehrwert (100 / Faktor).
const kaufpreisfaktorReferenz: Record<Objekttyp, Record<Lagetyp, number>> = {
  ETW: { GROSSSTADT: 28, KLEINSTADT: 20, LAENDLICH: 15 },
  MEHRFAMILIENHAUS: { GROSSSTADT: 24, KLEINSTADT: 18, LAENDLICH: 14 },
  HAUS: { GROSSSTADT: 26, KLEINSTADT: 19, LAENDLICH: 15 },
};

// Peters'sche Formel — Instandhaltungsrücklage nach Gebäudealter (€/m² Wohnfläche/Jahr).
const instandhaltungssaetze = [
  { von: 0, bis: 21, satz: 7.1 },
  { von: 22, bis: 32, satz: 9.0 },
  { von: 33, bis: null, satz: 11.5 },
];

async function main() {
  for (const bundesland of Object.values(Bundesland)) {
    await prisma.referenceGrunderwerbsteuer.upsert({
      where: { bundesland },
      update: { satzProzent: grunderwerbsteuer[bundesland] },
      create: { bundesland, satzProzent: grunderwerbsteuer[bundesland] },
    });

    for (const lagetyp of Object.values(Lagetyp)) {
      const mietpreisProM2 = Math.round(grossstadtMietpreis[bundesland] * lagetypFaktor[lagetyp] * 100) / 100;
      await prisma.referenceMietpreis.upsert({
        where: { bundesland_lagetyp: { bundesland, lagetyp } },
        update: { mietpreisProM2 },
        create: { bundesland, lagetyp, mietpreisProM2 },
      });
    }
  }

  for (const gewerk of Object.values(Gewerk)) {
    const { min, max } = gewerkKosten[gewerk];
    await prisma.referenceGewerkKosten.upsert({
      where: { gewerk },
      update: { kostenProM2Min: min, kostenProM2Max: max },
      create: { gewerk, kostenProM2Min: min, kostenProM2Max: max },
    });
  }

  for (const objekttyp of Object.values(Objekttyp)) {
    for (const lagetyp of Object.values(Lagetyp)) {
      const wert = kaufpreisfaktorReferenz[objekttyp][lagetyp];
      await prisma.referenceKaufpreisfaktor.upsert({
        where: { objekttyp_lagetyp: { objekttyp, lagetyp } },
        update: { kaufpreisfaktorReferenz: wert },
        create: { objekttyp, lagetyp, kaufpreisfaktorReferenz: wert },
      });
    }
  }

  await prisma.referenceInstandhaltungssatz.deleteMany();
  for (const { von, bis, satz } of instandhaltungssaetze) {
    await prisma.referenceInstandhaltungssatz.create({
      data: { altersklasseVonJahren: von, altersklasseBisJahren: bis, satzProM2ProJahr: satz },
    });
  }

  const kaufnebenkostenDefaults = await prisma.referenceKaufnebenkostenDefaults.findFirst();
  if (!kaufnebenkostenDefaults) {
    await prisma.referenceKaufnebenkostenDefaults.create({
      data: { notarProzent: 1.0, grundbuchProzent: 0.5 },
    });
  }

  console.log("Seed abgeschlossen.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
