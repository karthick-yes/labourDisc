import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { SESSION_COOKIE, SESSION_DAYS } from "@/config/app";
import { db } from "@/db";
import { contractors, sessions } from "@/db/schema";

// Sessions are rows in the DB. The browser holds a random token in an
// httpOnly cookie; we store only its sha256, so a DB leak can't be replayed.
// Logging out (or deleting the row) ends the session immediately.

const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export async function createSession(contractorId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(sessions).values({ id: hashToken(token), contractorId, expiresAt });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.id, hashToken(token)));
  store.delete(SESSION_COOKIE);
}

export type CurrentContractor = {
  id: string;
  name: string;
  phone: string;
  baseLat: number | null;
  baseLng: number | null;
  areaName: string | null;
  defaultProbationDays: number;
};

/** The logged-in contractor, or null. Cached per request. */
export const getContractor = cache(async (): Promise<CurrentContractor | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const [row] = await db
    .select({
      id: contractors.id,
      name: contractors.name,
      phone: contractors.phone,
      baseLat: contractors.baseLat,
      baseLng: contractors.baseLng,
      areaName: contractors.areaName,
      defaultProbationDays: contractors.defaultProbationDays,
    })
    .from(sessions)
    .innerJoin(contractors, eq(contractors.id, sessions.contractorId))
    .where(and(eq(sessions.id, hashToken(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);
  return row ?? null;
});

/** Use in every page, action and route that touches tenant data. */
export async function requireContractor(): Promise<CurrentContractor> {
  const contractor = await getContractor();
  if (!contractor) redirect("/login");
  return contractor;
}
