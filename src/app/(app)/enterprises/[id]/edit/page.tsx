import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui";
import { requireContractor } from "@/lib/auth/session";
import { getEnterprise } from "@/lib/data/enterprises";
import { getCategories } from "@/lib/data/reference";
import { localName } from "@/lib/names";
import { EnterpriseForm } from "../../EnterpriseForm";

export default async function EditEnterprisePage(props: PageProps<"/enterprises/[id]/edit">) {
  const contractor = await requireContractor();
  const { id } = await props.params;
  const [t, locale, categories, enterprise] = await Promise.all([
    getTranslations(),
    getLocale(),
    getCategories(),
    getEnterprise(contractor.id, id),
  ]);
  if (!enterprise) notFound();

  return (
    <>
      <PageHeader title={t("enterprises.editTitle")} back={{ href: `/enterprises/${id}`, label: enterprise.name }} />
      <EnterpriseForm categories={categories.map((c) => ({ id: c.id, label: localName(locale, c) }))} initial={enterprise} />
    </>
  );
}
