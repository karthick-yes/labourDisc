"use server";

import { redirect } from "next/navigation";
import { adminLogin, adminLogout } from "@/lib/auth/admin";

// Slows down guessing; ADMIN_PIN should be long anyway.
const delay = () => new Promise((r) => setTimeout(r, 800));

export async function loginAdmin(_prev: { error?: boolean }, form: FormData): Promise<{ error?: boolean }> {
  const ok = await adminLogin(String(form.get("pin") ?? ""));
  if (!ok) {
    await delay();
    return { error: true };
  }
  redirect("/admin");
}

export async function logoutAdmin() {
  await adminLogout();
  redirect("/admin");
}
