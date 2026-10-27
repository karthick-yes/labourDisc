import "server-only";
import { listEnterprises } from "@/lib/data/enterprises";
import { getReference } from "@/lib/data/reference";
import { localName } from "@/lib/names";

/** Options for the New/Edit Need form, in the current language. */
export async function needFormData(contractorId: string, locale: string) {
  const [ref, enterprises] = await Promise.all([getReference(), listEnterprises(contractorId, { limit: 5000 })]);
  return {
    enterprises: enterprises.map((e) => ({ id: e.id, name: e.name, area: e.areaName, categoryId: e.categoryId })),
    skills: ref.skills.map((s) => ({ id: s.id, label: localName(locale, s) })),
    categories: ref.categories.map((c) => ({ id: c.id, label: localName(locale, c) })),
    categoryRoles: Object.fromEntries(ref.categories.map((c) => [c.id, c.roles])),
  };
}
