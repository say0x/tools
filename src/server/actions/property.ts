"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/server/db";
import {
  BUNDESLAENDER,
  EIGENTUMSTYPEN,
  FINANZIERUNGSARTEN,
  GEWERKE,
  LAGETYPEN,
  OBJEKTTYPEN,
  SANIERUNGSMODI,
} from "@/server/calc/types";
import { PROPERTY_INCLUDE } from "@/server/data/mappers";

const gewerkSchema = z.object({
  gewerk: z.enum(GEWERKE),
  zustand: z.coerce.number().int().min(1).max(6),
  eigentumsTyp: z.enum(EIGENTUMSTYPEN),
  geschaetzteKostenOverride: z.coerce.number().nullable().optional(),
  kommentar: z.string().optional(),
});

const financingSchema = z.object({
  eigenkapital: z.coerce.number().min(0),
  zinssatzProzent: z.coerce.number().min(0),
  anfaenglicheTilgungProzent: z.coerce.number().min(0),
  zinsbindungJahre: z.coerce.number().int().min(1),
  finanzierungsart: z.enum(FINANZIERUNGSARTEN),
  eigenkapitalquoteManuellProzent: z.coerce.number().nullable().optional(),
});

const exitSchema = z.object({
  geplant: z.boolean(),
  wertsteigerungProzentJaehrlich: z.coerce.number(),
  haltedauerJahre: z.coerce.number().int().min(1),
});

const propertySchema = z.object({
  name: z.string().min(1, "Name fehlt"),
  kaufpreis: z.coerce.number().min(0),
  wohnflaeche: z.coerce.number().min(1),
  bundesland: z.enum(BUNDESLAENDER),
  lagetyp: z.enum(LAGETYPEN),
  objekttyp: z.enum(OBJEKTTYPEN),
  baujahr: z.coerce.number().int().min(1700).max(2100),
  anzahlEinheiten: z.coerce.number().int().min(1),

  grunderwerbsteuerProzent: z.coerce.number().min(0),
  grunderwerbsteuerOverride: z.boolean(),
  notarProzent: z.coerce.number().min(0),
  notarOverride: z.boolean(),
  grundbuchProzent: z.coerce.number().min(0),
  grundbuchOverride: z.boolean(),
  maklerprovisionProzent: z.coerce.number().min(0),
  maklerprovisionOverride: z.boolean(),

  sanierungsmodus: z.enum(SANIERUNGSMODI),
  sofortinvestitionPauschal: z.coerce.number().min(0),

  kaltmieteMonatlich: z.coerce.number().min(0),
  mietsteigerungProzentJaehrlich: z.coerce.number(),

  hausgeldUmlagefaehigMonatlich: z.coerce.number().min(0),
  hausgeldNichtUmlagefaehigMonatlich: z.coerce.number().min(0),
  grundsteuerJaehrlich: z.coerce.number().min(0),
  instandhaltungsruecklageMonatlich: z.coerce.number().min(0),
  instandhaltungsruecklageOverride: z.boolean(),
  verwaltungskostenMonatlich: z.coerce.number().min(0),
  leerstandsquoteProzent: z.coerce.number().min(0).max(100),
  versicherungJaehrlich: z.coerce.number().min(0),
  versicherungUmlagefaehig: z.boolean(),

  afaSatzProzent: z.coerce.number().min(0),
  afaSonderabschreibung: z.boolean(),

  financing: financingSchema,
  gewerke: z.array(gewerkSchema),
  exit: exitSchema,
});

export type PropertyFormValues = z.infer<typeof propertySchema>;

function splitPropertyData(data: PropertyFormValues) {
  const { name, financing, gewerke, exit, ...property } = data;
  return { name, property, financing, gewerke, exit };
}

export async function erstelleObjekt(values: PropertyFormValues) {
  const data = propertySchema.parse(values);
  const { name, property, financing, gewerke, exit } = splitPropertyData(data);

  const created = await prisma.property.create({
    data: {
      ...property,
      asset: { create: { type: "IMMOBILIE", name } },
      financing: { create: financing },
      exit: { create: exit },
      gewerke: { createMany: { data: gewerke } },
    },
  });

  revalidatePath("/immobilien/objekte");
  redirect(`/immobilien/objekte/${created.id}`);
}

export async function aktualisiereObjekt(id: string, values: PropertyFormValues) {
  const data = propertySchema.parse(values);
  const { name, property, financing, gewerke, exit } = splitPropertyData(data);

  await prisma.$transaction(async (tx) => {
    const existing = await tx.property.findUniqueOrThrow({ where: { id } });

    await tx.asset.update({ where: { id: existing.assetId }, data: { name } });
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
}

export async function loescheObjekt(id: string) {
  const property = await prisma.property.findUniqueOrThrow({ where: { id } });
  await prisma.asset.delete({ where: { id: property.assetId } }); // cascade löscht Property + Relationen
  revalidatePath("/immobilien/objekte");
}

export async function dupliziereObjekt(id: string) {
  const original = await prisma.property.findUniqueOrThrow({
    where: { id },
    include: { ...PROPERTY_INCLUDE, asset: true },
  });

  const created = await prisma.property.create({
    data: {
      kaufpreis: original.kaufpreis,
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
      kaltmieteMonatlich: original.kaltmieteMonatlich,
      mietsteigerungProzentJaehrlich: original.mietsteigerungProzentJaehrlich,
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
      afaSonderabschreibung: original.afaSonderabschreibung,
      asset: { create: { type: "IMMOBILIE", name: `${original.asset.name} (Kopie)` } },
      financing: original.financing
        ? {
            create: {
              eigenkapital: original.financing.eigenkapital,
              zinssatzProzent: original.financing.zinssatzProzent,
              anfaenglicheTilgungProzent: original.financing.anfaenglicheTilgungProzent,
              zinsbindungJahre: original.financing.zinsbindungJahre,
              finanzierungsart: original.financing.finanzierungsart,
              eigenkapitalquoteManuellProzent: original.financing.eigenkapitalquoteManuellProzent,
            },
          }
        : undefined,
      exit: original.exit
        ? {
            create: {
              geplant: original.exit.geplant,
              wertsteigerungProzentJaehrlich: original.exit.wertsteigerungProzentJaehrlich,
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
          })),
        },
      },
    },
  });

  revalidatePath("/immobilien/objekte");
  return created.id;
}
