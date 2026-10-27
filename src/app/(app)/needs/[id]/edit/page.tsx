import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui";
import { requireContractor } from "@/lib/auth/session";
import { getNeed } from "@/lib/data/needs";
import { needFormData } from "@/lib/forms/need-form-data";
import { NeedForm } from "../../NeedForm";

export default async function EditNeedPage(props: PageProps<"/needs/[id]/edit">) {
  const contractor = await requireContractor();
  const { id } = await props.params;
  const [t, locale, need] = await Promise.all([getTranslations(), getLocale(), getNeed(contractor.id, id)]);
  if (!need) notFound();
  const data = await needFormData(contractor.id, locale);

  return (
    <>
      <PageHeader title={t("needs.editTitle")} back={{ href: `/needs/${id}`, label: need.enterpriseName }} />
      <NeedForm
        {...data}
        ai={{ available: false, reason: "edit" }}
        initial={{
          id: need.id,
          enterpriseId: need.enterpriseId,
          skillId: need.skillId,
          countNeeded: need.countNeeded,
          wageOffered: need.wageOffered,
          startDate: need.startDate,
          notes: need.notes,
        }}
      />
    </>
  );
}
