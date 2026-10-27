import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// /admin is protected by ADMIN_PIN alone (one person: the app owner).
// The cookie is "<expiry>.<hmac(expiry)>" keyed by the PIN, so changing
// ADMIN_PIN logs everyone out.

const COOKIE = "pb_admin";
const HOURS = 12;

const sign = (pin: string, expiry: string) => createHmac("sha256", pin).update(`admin:${expiry}`).digest("hex");

export function adminConfigured() {
  return Boolean(process.env.ADMIN_PIN && process.env.ADMIN_PIN.length >= 4);
}

export async function isAdmin() {
  const pin = process.env.ADMIN_PIN;
  const value = (await cookies()).get(COOKIE)?.value;
  if (!pin || !value) return false;
  const [expiry, mac] = value.split(".");
  if (!expiry || !mac || Number(expiry) < Date.now()) return false;
  const expected = Buffer.from(sign(pin, expiry));
  const given = Buffer.from(mac);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export async function adminLogin(pin: string) {
  const real = process.env.ADMIN_PIN;
  if (!real) return false;
  const a = Buffer.from(pin);
  const b = Buffer.from(real);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  const expiry = String(Date.now() + HOURS * 3600_000);
  (await cookies()).set(COOKIE, `${expiry}.${sign(real, expiry)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: HOURS * 3600,
  });
  return true;
}

export async function adminLogout() {
  (await cookies()).delete({ name: COOKIE, path: "/admin" });
}
