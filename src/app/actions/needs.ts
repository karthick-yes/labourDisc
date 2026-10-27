"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireContractor } from "@/lib/auth/session";
import { createEnterprise } from "@/lib/data/enterprises";
import { createNeed, deleteNeed, setNeedStatus, updateNeed, type NeedStatus } from "@/lib/data/needs";
import { getSkills } from "@/lib/data/reference";
import { DAILY_WAGE, optionalNumber, optionalText } from "@/lib/validation";
import { parseEnterprise } from "@/lib/forms/enterprise";

// `error` is a translation key under needs.errors (or enterprises.errors).
export type NeedFormState = { error?: string };

const needSchema = z.object({
  skillId: z.string().min(1),
  countNeeded: z.coerce.number().int().min(1).max(100),
  wageOffered: optionalNumber(DAILY_WAGE.min, DAILY_WAGE.max),
  startDate: z
    .preprocess((v) => (v ? v : undefined), z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional())
    .transform((v) => v ?? null),
  notes: optionalText(1000),
});

export async function saveNeed(_prev: NeedFormState, form: FormData): Promise<NeedFormState> {
  const contractor = await requireContractor();

  const parsed = needSchema.safeParse({
    skillId: form.get("skillId"),
    countNeeded: form.get("countNeeded") || 1,
    wageOffered: form.get("wageOffered"),
    startDate: form.get("startDate"),
    notes: form.get("notes"),
  });
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    return { error: field === "skillId" ? "needs.errors.skillRequired" : field === "wageOffered" ? "needs.errors.invalidWage" : "needs.errors.invalid" };
  }
  if (!(await getSkills()).some((s) => s.id === parsed.data.skillId)) {
    return { error: "needs.errors.skillRequired" };
  }

  // Either an existing enterprise, or a new one typed into the same form.
  let enterpriseId = String(form.get("enterpriseId") ?? "");
  const id = form.get("id") ? String(form.get("id")) : null;
  if (enterpriseId === "new") {
    const ent = await parseEnterprise(form, "newEnterprise.");
    if ("error" in ent) return { error: `enterprises.errors.${ent.error}` };
    enterpriseId = await createEnterprise(contractor.id, ent.data);
  }
  if (!enterpriseId) return { error: "needs.errors.enterpriseRequired" };

  const input = { ...parsed.data, enterpriseId };
  let targetId = id;
  if (id) {
    if (!(await updateNeed(contractor.id, id, input))) return { error: "needs.errors.invalid" };
  } else {
    targetId = await createNeed(contractor.id, input);
    if (!targetId) return { error: "needs.errors.enterpriseRequired" };
  }

  revalidatePath("/", "layout");
  redirect(id ? `/needs/${targetId}` : `/needs/${targetId}?new=1`);
}

export async function changeNeedStatus(id: string, status: NeedStatus) {
  const contractor = await requireContractor();
  await setNeedStatus(contractor.id, id, z.enum(["open", "filled", "cancelled"]).parse(status));
  revalidatePath("/", "layout");
}

export async function removeNeed(id: string) {
  const contractor = await requireContractor();
  await deleteNeed(contractor.id, id);
  revalidatePath("/", "layout");
  redirect("/needs");
}
