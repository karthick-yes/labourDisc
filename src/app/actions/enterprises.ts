"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireContractor } from "@/lib/auth/session";
import { createEnterprise, deleteEnterprise, updateEnterprise } from "@/lib/data/enterprises";
import { parseEnterprise } from "@/lib/forms/enterprise";

// `error` is a translation key under enterprises.errors.
export type EnterpriseFormState = { error?: string };

export async function saveEnterprise(_prev: EnterpriseFormState, form: FormData): Promise<EnterpriseFormState> {
  const contractor = await requireContractor();
  const parsed = await parseEnterprise(form);
  if ("error" in parsed) return parsed;

  const id = form.get("id") ? String(form.get("id")) : null;
  let targetId = id;
  if (id) {
    if (!(await updateEnterprise(contractor.id, id, parsed.data))) return { error: "notFound" };
  } else {
    targetId = await createEnterprise(contractor.id, parsed.data);
  }
  revalidatePath("/", "layout");
  redirect(`/enterprises/${targetId}`);
}

export async function removeEnterprise(id: string) {
  const contractor = await requireContractor();
  await deleteEnterprise(contractor.id, id);
  revalidatePath("/", "layout");
  redirect("/enterprises");
}
