"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { getActiveUserId } from "@/server/session";
import { PROPERTY_INCLUDE, splitPropertyData } from "@/server/data/mappers";
import { propertySchema, type PropertyFormValues } from "./property-schema";
import { ausfuehren, type ActionResult } from "./result";

export type { PropertyFormValues } from "./property-schema";

/** Wirft eine lesbare, deutschsprachige Fehlermeldung statt einer rohen ZodError-Exception. */
function parsePropertyFormValues(values: PropertyFormValues): PropertyFormValues {
  const result = propertySchema.safeParse(values);
  if (!result.success) {
    const meldung = result.error.issues.map((issue) => issue.message).join(" · ");
    throw new Error(`Ungültige Eingabe: ${meldung}`);
  }
  return result.data;
}

export async function erstelleObjekt(values: PropertyFormValues): Promise<ActionResult> {
  return ausfuehren(async () => {
    const data = parsePropertyFormValues(values);
    const { name, besitzstatus, property, financing, gewerke, exit } = splitPropertyData(data);
    const userId = await getActiveUserId();

    const created = await prisma.property.create({
      data: {
        ...property,
        asset: { create: { type: "IMMOBILIE", name, besitzstatus, userId } },
        financing: { create: financing },
        exit: { create: exit },
        gewerke: { createMany: { data: gewerke } },
      },
    });

    revalidatePath("/immobilien/objekte");
    redirect(`/immobilien/objekte/${created.id}`);
  });
}

export async function aktualisiereObjekt(id: string, values: PropertyFormValues): Promise<ActionResult> {
  return ausfuehren(async () => {
    const data = parsePropertyFormValues(values);
    const { name, besitzstatus, property, financing, gewerke, exit } = splitPropertyData(data);
    const userId = await getActiveUserId();

    await prisma.$transaction(async (tx) => {
      const existing = await tx.property.findFirstOrThrow({ where: { id, asset: { userId } } });

      await tx.asset.update({ where: { id: existing.assetId }, data: { name, besitzstatus } });
      await tx.property.update({ where: { id }, data: property });
      await tx.propertyFinancing.upsert({
        where: { propertyId: id },
        update: financing,
        create: { ...financing, propertyId: id },
      });
      await tx.propertyExit.upsert({
        where: { propertyId: id },
        update: exit,
        create: { ...exit, propertyId: id },
      });

      await tx.propertyGewerk.deleteMany({ where: { propertyId: id } });
      if (gewerke.length > 0) {
        await tx.propertyGewerk.createMany({ data: gewerke.map((g) => ({ ...g, propertyId: id })) });
      }
    });

    revalidatePath("/immobilien/objekte");
    revalidatePath(`/immobilien/objekte/${id}`);
  });
}

export async function loescheObjekt(id: string) {
  const userId = await getActiveUserId();
  const property = await prisma.property.findFirstOrThrow({ where: { id, asset: { userId } } });
  await prisma.asset.delete({ where: { id: property.assetId } }); // cascade löscht Property + Relationen
  revalidatePath("/immobilien/objekte");
}

/** Mehrfachlöschen für die Objekt-Bibliothek (Mehrfachauswahl-Checkboxen). */
export async function loescheObjekte(ids: string[]) {
  const userId = await getActiveUserId();
  const properties = await prisma.property.findMany({ where: { id: { in: ids }, asset: { userId } }, select: { assetId: true } });
  await prisma.asset.deleteMany({ where: { id: { in: properties.map((p) => p.assetId) } } }); // cascade löscht Property + Relationen
  revalidatePath("/immobilien/objekte");
}

export async function dupliziereObjekt(id: string) {
  const userId = await getActiveUserId();
  const original = await prisma.property.findFirstOrThrow({
    where: { id, asset: { userId } },
    include: { ...PROPERTY_INCLUDE, asset: true },
  });

  // Basisname ohne ein bereits vorhandenes " (Kopie)"-Suffix — sonst würde das Duplizieren
  // eines Duplikats den Suffix immer weiter anhängen ("Objekt (Kopie) (Kopie) (Kopie)...").
  const basisname = original.asset.name.replace(/ \(Kopie\)$/, "");

  const created = await prisma.property.create({
    data: {
      kaufpreis: original.kaufpreis,
      kaufdatum: original.kaufdatum,
      wohnflaeche: original.wohnflaeche,
      bundesland: original.bundesland,
      lagetyp: original.lagetyp,
      objekttyp: original.objekttyp,
      baujahr: original.baujahr,
      anzahlEinheiten: original.anzahlEinheiten,
      grunderwerbsteuerProzent: original.grunderwerbsteuerProzent,
      grunderwerbsteuerOverride: original.grunderwerbsteuerOverride,
      notarProzent: original.notarProzent,
      notarOverride: original.notarOverride,
      grundbuchProzent: original.grundbuchProzent,
      grundbuchOverride: original.grundbuchOverride,
      maklerprovisionProzent: original.maklerprovisionProzent,
      maklerprovisionOverride: original.maklerprovisionOverride,
      sanierungsmodus: original.sanierungsmodus,
      sofortinvestitionPauschal: original.sofortinvestitionPauschal,
      gebaeudeWohnflaecheGesamt: original.gebaeudeWohnflaecheGesamt,
      miteigentumsanteilProzent: original.miteigentumsanteilProzent,
      miteigentumsanteilOverride: original.miteigentumsanteilOverride,
      kaltmieteMonatlich: original.kaltmieteMonatlich,
      mietsteigerungProzentJaehrlich: original.mietsteigerungProzentJaehrlich,
      wertsteigerungProzentJaehrlich: original.wertsteigerungProzentJaehrlich,
      kostensteigerungProzentJaehrlich: original.kostensteigerungProzentJaehrlich,
      hausgeldUmlagefaehigMonatlich: original.hausgeldUmlagefaehigMonatlich,
      hausgeldNichtUmlagefaehigMonatlich: original.hausgeldNichtUmlagefaehigMonatlich,
      grundsteuerJaehrlich: original.grundsteuerJaehrlich,
      instandhaltungsruecklageMonatlich: original.instandhaltungsruecklageMonatlich,
      instandhaltungsruecklageOverride: original.instandhaltungsruecklageOverride,
      verwaltungskostenMonatlich: original.verwaltungskostenMonatlich,
      leerstandsquoteProzent: original.leerstandsquoteProzent,
      versicherungJaehrlich: original.versicherungJaehrlich,
      versicherungUmlagefaehig: original.versicherungUmlagefaehig,
      afaSatzProzent: original.afaSatzProzent,
      afaSatzProzentOverride: original.afaSatzProzentOverride,
      afaSonderabschreibung: original.afaSonderabschreibung,
      ansprechpartnerName: original.ansprechpartnerName,
      ansprechpartnerTelefon: original.ansprechpartnerTelefon,
      ansprechpartnerEmail: original.ansprechpartnerEmail,
      ansprechpartnerNotizen: original.ansprechpartnerNotizen,
      notizen: original.notizen,
      quelleUrl: original.quelleUrl,
      asset: { create: { type: "IMMOBILIE", name: `${basisname} (Kopie)`, besitzstatus: original.asset.besitzstatus, userId } },
      financing: original.financing
        ? {
            create: {
              eigenkapital: original.financing.eigenkapital,
              zinssatzProzent: original.financing.zinssatzProzent,
              anfaenglicheTilgungProzent: original.financing.anfaenglicheTilgungProzent,
              zinsbindungJahre: original.financing.zinsbindungJahre,
              finanzierungsart: original.financing.finanzierungsart,
              eigenkapitalquoteManuellProzent: original.financing.eigenkapitalquoteManuellProzent,
              anschlusszinsAufschlagProzent: original.financing.anschlusszinsAufschlagProzent,
              sondertilgungProzent: original.financing.sondertilgungProzent,
              sondertilgungMaxProzent: original.financing.sondertilgungMaxProzent,
            },
          }
        : undefined,
      exit: original.exit
        ? {
            create: {
              geplant: original.exit.geplant,
              haltedauerJahre: original.exit.haltedauerJahre,
            },
          }
        : undefined,
      gewerke: {
        createMany: {
          data: original.gewerke.map((g) => ({
            gewerk: g.gewerk,
            zustand: g.zustand,
            eigentumsTyp: g.eigentumsTyp,
            geschaetzteKostenOverride: g.geschaetzteKostenOverride,
            kommentar: g.kommentar,
            baujahr: g.baujahr,
            verglasung: g.verglasung,
            sofortSanieren: g.sofortSanieren,
          })),
        },
      },
    },
  });

  revalidatePath("/immobilien/objekte");
  return created.id;
}
