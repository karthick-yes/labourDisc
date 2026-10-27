import "server-only";
import { z } from "zod";
import type { EnterpriseInput } from "@/lib/data/enterprises";
import { getCategories } from "@/lib/data/reference";
import { normalizePhone } from "@/lib/phone";
import { optionalLocationSchema, optionalText } from "@/lib/validation";

/**
 * Parses enterprise fields from a form. `prefix` lets the New Need form
 * embed a "new enterprise" sub-form (fields named newEnterprise.name etc).
 */
export async function parseEnterprise(
  form: FormData,
  prefix = "",
): Promise<{ data: EnterpriseInput } | { error: string }> {
  const get = (k: string) => form.get(prefix + k);
  const name = z.string().trim().min(1).max(100).safeParse(get("name"));
  if (!name.success) return { error: "nameRequired" };

  const rawPhone = String(get("phone") ?? "").trim();
  const phone = rawPhone ? normalizePhone(rawPhone) : null;
  if (rawPhone && !phone) return { error: "invalidPhone" };

  const categoryId = String(get("categoryId") ?? "") || null;
  if (categoryId && !(await getCategories()).some((c) => c.id === categoryId)) return { error: "invalid" };

  const location = optionalLocationSchema.safeParse({
    lat: get("lat"),
    lng: get("lng"),
    areaName: get("areaName"),
  });
  if (!location.success) return { error: "invalid" };

  const notes = optionalText(1000).safeParse(get("notes"));
  return {
    data: {
      name: name.data,
      phone,
      categoryId,
      ...location.data,
      notes: notes.success ? notes.data : null,
    },
  };
}
