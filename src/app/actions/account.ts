"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { contractors } from "@/db/schema";
import { verifyPin } from "@/lib/auth/pin";
import { destroySession, requireContractor } from "@/lib/auth/session";
import { storage } from "@/lib/storage";
import { listMediaKeys } from "@/lib/data/account";

export type DeleteState = { error?: string };

/** Deletes the contractor and everything they own (DB cascades + media files). */
export async function deleteAccount(_prev: DeleteState, form: FormData): Promise<DeleteState> {
  const contractor = await requireContractor();
  const [row] = await db.select({ pinHash: contractors.pinHash }).from(contractors).where(eq(contractors.id, contractor.id));
  if (!row || !(await verifyPin(String(form.get("pin") ?? ""), row.pinHash))) return { error: "wrongPin" };

  const keys = await listMediaKeys(contractor.id);
  await destroySession();
  await db.delete(contractors).where(eq(contractors.id, contractor.id));
  await Promise.all(keys.map((k) => storage.delete(k).catch(() => {})));
  redirect("/signup");
}
