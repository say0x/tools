"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/server/db";
import { ACTIVE_USER_COOKIE } from "@/server/session";
import { ausfuehren, type ActionResult } from "./result";

export async function ladeNutzer() {
  return prisma.user.findMany({ orderBy: { createdAt: "asc" } });
}

export async function erstelleNutzer(name: string): Promise<ActionResult<{ id: string }>> {
  return ausfuehren(async () => {
    const trimmed = name.trim();
    if (!trimmed) throw new Error("Name darf nicht leer sein.");
    const user = await prisma.user.create({ data: { name: trimmed } });
    revalidatePath("/nutzer");
    return { id: user.id };
  });
}

export async function wechsleNutzer(userId: string): Promise<ActionResult> {
  return ausfuehren(async () => {
    await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    (await cookies()).set(ACTIVE_USER_COOKIE, userId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    revalidatePath("/", "layout");
  });
}

/**
 * Void-Wrapper um wechsleNutzer(), damit `<form action={...}>` (verlangt
 * `void | Promise<void>`, kein ActionResult) direkt per `.bind(null, userId)`
 * verwendet werden kann — hier gibt es keinen Formularzustand, den ein
 * ActionResult sinnvoll transportieren müsste.
 */
export async function wechsleNutzerFormAction(userId: string) {
  await wechsleNutzer(userId);
}
