"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { LOCALE_COOKIE, LOCALES } from "@/config/app";
import { db } from "@/db";
import { contractors } from "@/db/schema";
import { requireContractor } from "@/lib/auth/session";
import { locationSchema } from "@/lib/validation";

export async function setLocale(locale: string) {
  const parsed = z.enum(LOCALES).safeParse(locale);
  if (!parsed.success) return;
  (await cookies()).set(LOCALE_COOKIE, parsed.data, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}

// `error` is a translation key; `ok` flips true after a successful save.
export type SettingsState = { error?: string; ok?: boolean };

export async function updateSettings(
  _prev: SettingsState,
  form: FormData,
): Promise<SettingsState> {
  const contractor = await requireContractor();

  const probation = z.coerce.number().int().min(1).max(90).safeParse(form.get("probationDays"));
  if (!probation.success) return { error: "settings.errors.invalidProbation" };

  const location = locationSchema.safeParse({
    lat: form.get("lat"),
    lng: form.get("lng"),
    areaName: form.get("areaName"),
  });
  if (!location.success) return { error: "auth.errors.locationRequired" };

  await db
    .update(contractors)
    .set({
      defaultProbationDays: probation.data,
      baseLat: location.data.lat,
      baseLng: location.data.lng,
      areaName: location.data.areaName,
    })
    .where(eq(contractors.id, contractor.id));

  revalidatePath("/", "layout");
  return { ok: true };
}
