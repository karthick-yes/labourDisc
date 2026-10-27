"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireContractor } from "@/lib/auth/session";
import { applyPlacementAction, createPlacement, ratePlacement, replacePlacement, type PlacementAction } from "@/lib/data/placements";
import { DAILY_WAGE, optionalText } from "@/lib/validation";

export type PlacementFormState = { error?: string };

const placementSchema = z.object({
  workerId: z.string().uuid(),
  needId: z.string().uuid(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  wage: z.coerce.number().int().min(DAILY_WAGE.min).max(DAILY_WAGE.max),
  commissionAmount: z.coerce.number().int().min(0).max(100000),
  probationDays: z.coerce.number().int().min(0).max(90),
});

export async function savePlacement(_prev: PlacementFormState, form: FormData): Promise<PlacementFormState> {
  const contractor = await requireContractor();
  const parsed = placementSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    return { error: field === "wage" ? "invalidWage" : field === "commissionAmount" ? "invalidCommission" : "invalid" };
  }
  const id = await createPlacement(contractor.id, parsed.data);
  if (!id) return { error: "invalid" };
  revalidatePath("/", "layout");
  redirect(`/placements/${id}?new=1`);
}

export async function placementAction(id: string, action: PlacementAction) {
  const contractor = await requireContractor();
  await applyPlacementAction(contractor.id, id, z.enum(["paid", "cancel", "confirm", "end", "refund"]).parse(action));
  revalidatePath("/", "layout");
}

/** Send another worker in place of one who failed during the trial. */
export async function sendReplacement(id: string, workerId: string) {
  const contractor = await requireContractor();
  const newId = await replacePlacement(contractor.id, z.string().uuid().parse(id), z.string().uuid().parse(workerId));
  revalidatePath("/", "layout");
  redirect(newId ? `/placements/${newId}?replaced=1` : `/placements/${id}`);
}

export async function ratePlacementAction(id: string, score: number, note: string) {
  const contractor = await requireContractor();
  const s = z.number().int().min(1).max(5).parse(score);
  const n = optionalText(300).parse(note);
  await ratePlacement(contractor.id, id, s, n);
  revalidatePath("/", "layout");
}
