"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  PIN_LOCK_MINUTES,
  PIN_MAX_ATTEMPTS,
  PIN_MAX_LENGTH,
  PIN_MIN_LENGTH,
} from "@/config/app";
import { db } from "@/db";
import { contractors } from "@/db/schema";
import { hashPin, verifyPin } from "@/lib/auth/pin";
import { createSession, destroySession } from "@/lib/auth/session";
import { normalizePhone } from "@/lib/phone";
import { locationSchema } from "@/lib/validation";

// `error` is a translation key under auth.errors.
export type AuthState = { error?: string; values?: Record<string, string | number> };

const pinSchema = z
  .string()
  .regex(new RegExp(`^\\d{${PIN_MIN_LENGTH},${PIN_MAX_LENGTH}}$`));

export async function login(_prev: AuthState, form: FormData): Promise<AuthState> {
  const phone = normalizePhone(String(form.get("phone") ?? ""));
  const pin = pinSchema.safeParse(form.get("pin"));
  if (!phone) return { error: "invalidPhone" };
  if (!pin.success) return { error: "invalidPin" };

  const [contractor] = await db
    .select()
    .from(contractors)
    .where(eq(contractors.phone, phone))
    .limit(1);
  if (!contractor) return { error: "wrongCredentials" };

  if (contractor.lockedUntil && contractor.lockedUntil > new Date()) {
    const minutes = Math.ceil((contractor.lockedUntil.getTime() - Date.now()) / 60000);
    return { error: "locked", values: { minutes } };
  }

  if (!(await verifyPin(pin.data, contractor.pinHash))) {
    const attempts = contractor.failedPinAttempts + 1;
    const lock = attempts >= PIN_MAX_ATTEMPTS;
    await db
      .update(contractors)
      .set({
        failedPinAttempts: lock ? 0 : attempts,
        lockedUntil: lock ? new Date(Date.now() + PIN_LOCK_MINUTES * 60000) : null,
      })
      .where(eq(contractors.id, contractor.id));
    return lock
      ? { error: "locked", values: { minutes: PIN_LOCK_MINUTES } }
      : { error: "wrongCredentials" };
  }

  await db
    .update(contractors)
    .set({ failedPinAttempts: 0, lockedUntil: null })
    .where(eq(contractors.id, contractor.id));
  await createSession(contractor.id);
  redirect("/");
}

export async function signup(_prev: AuthState, form: FormData): Promise<AuthState> {
  const name = String(form.get("name") ?? "").trim();
  const phone = normalizePhone(String(form.get("phone") ?? ""));
  const pin = pinSchema.safeParse(form.get("pin"));
  const location = locationSchema.safeParse({
    lat: form.get("lat"),
    lng: form.get("lng"),
    areaName: form.get("areaName"),
  });

  if (!name || name.length > 80) return { error: "nameRequired" };
  if (!phone) return { error: "invalidPhone" };
  if (!pin.success) return { error: "invalidPin" };
  if (pin.data !== form.get("pin2")) return { error: "pinMismatch" };
  if (!location.success) return { error: "locationRequired" };

  const requiredCode = process.env.SIGNUP_CODE;
  if (requiredCode && form.get("signupCode") !== requiredCode) {
    return { error: "badSignupCode" };
  }

  const [created] = await db
    .insert(contractors)
    .values({
      name,
      phone,
      pinHash: await hashPin(pin.data),
      baseLat: location.data.lat,
      baseLng: location.data.lng,
      areaName: location.data.areaName,
    })
    .onConflictDoNothing({ target: contractors.phone })
    .returning({ id: contractors.id });
  if (!created) return { error: "phoneTaken" };

  await createSession(created.id);
  redirect("/");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

