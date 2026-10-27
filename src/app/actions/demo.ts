"use server";

import { revalidatePath } from "next/cache";
import { requireContractor } from "@/lib/auth/session";
import { clearDemoData, loadDemoData } from "@/lib/demo";

export type DemoState = {
  ok?: "loaded" | "cleared";
  error?: string; // translation key under settings.demo
  counts?: { enterprises: number; needs: number; workers: number };
};

export async function loadDemo(): Promise<DemoState> {
  const contractor = await requireContractor();
  if (contractor.baseLat == null) return { error: "needLocation" };
  try {
    const r = await loadDemoData(contractor);
    revalidatePath("/", "layout");
    if (r.enterprises === 0) return { error: r.liveError ? "fetchFailed" : "noPlaces" };
    return { ok: "loaded", counts: { enterprises: r.enterprises, needs: r.needs, workers: r.workers } };
  } catch (err) {
    console.error("Demo load failed", err);
    return { error: "failed" };
  }
}

export async function clearDemo(): Promise<DemoState> {
  const contractor = await requireContractor();
  await clearDemoData(contractor.id);
  revalidatePath("/", "layout");
  return { ok: "cleared" };
}
