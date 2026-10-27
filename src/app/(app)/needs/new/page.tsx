import { getLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui";
import { aiStatus } from "@/lib/ai/usage";
import { requireContractor } from "@/lib/auth/session";
import { needFormData } from "@/lib/forms/need-form-data";
import { NeedForm } from "../NeedForm";

export default async function NewNeedPage(props: PageProps<"/needs/new">) {
  const contractor = await requireContractor();
  const [sp, t, locale, ai] = await Promise.all([props.searchParams, getTranslations(), getLocale(), aiStatus(contractor.id)]);
  const data = await needFormData(contractor.id, locale);
  const preselect = typeof sp.enterprise === "string" ? sp.enterprise : undefined;

  return (
    <>
      <PageHeader title={t("needs.newTitle")} back={{ href: "/", label: t("nav.home") }} />
      <NeedForm {...data} ai={ai} preselectEnterpriseId={data.enterprises.some((e) => e.id === preselect) ? preselect : undefined} />
    </>
  );
}
