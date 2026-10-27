import { getLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui";
import { getCategories } from "@/lib/data/reference";
import { localName } from "@/lib/names";
import { EnterpriseForm } from "../EnterpriseForm";

export default async function NewEnterprisePage() {
  const [t, locale, categories] = await Promise.all([getTranslations(), getLocale(), getCategories()]);
  return (
    <>
      <PageHeader title={t("enterprises.newTitle")} back={{ href: "/enterprises", label: t("enterprises.title") }} />
      <EnterpriseForm categories={categories.map((c) => ({ id: c.id, label: localName(locale, c) }))} />
    </>
  );
}
