import { getLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui";
import { requireContractor } from "@/lib/auth/session";
import { getCategories } from "@/lib/data/reference";
import { localArea, localName } from "@/lib/names";
import { FindBusinesses } from "./FindBusinesses";

export default async function FindBusinessesPage() {
  const contractor = await requireContractor();
  const [t, locale, categories] = await Promise.all([getTranslations(), getLocale(), getCategories()]);
  const base =
    contractor.baseLat != null && contractor.baseLng != null
      ? { lat: contractor.baseLat, lng: contractor.baseLng, label: localArea(locale, contractor.areaName) ?? t("find.myBase") }
      : null;

  return (
    <>
      <PageHeader title={t("find.title")} back={{ href: "/enterprises", label: t("enterprises.title") }} />
      <p className="-mt-2 mb-4 text-[15px] text-ink-2">{t("find.hint")}</p>
      <FindBusinesses base={base} categories={categories.map((c) => ({ id: c.id, label: localName(locale, c) }))} />
    </>
  );
}
