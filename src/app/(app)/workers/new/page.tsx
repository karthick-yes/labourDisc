import { getLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui";
import { VIDEO_MAX_BYTES, VIDEO_MAX_SECONDS } from "@/config/limits";
import { aiStatus } from "@/lib/ai/usage";
import { requireContractor } from "@/lib/auth/session";
import { getSkills } from "@/lib/data/reference";
import { localName } from "@/lib/names";
import { WorkerForm } from "../WorkerForm";

export default async function NewWorkerPage() {
  const contractor = await requireContractor();
  const [t, locale, skills, ai] = await Promise.all([getTranslations(), getLocale(), getSkills(), aiStatus(contractor.id)]);
  return (
    <>
      <PageHeader title={t("workers.newTitle")} back={{ href: "/", label: t("nav.home") }} />
      <WorkerForm
        skillOptions={skills.map((s) => ({ id: s.id, label: localName(locale, s) }))}
        ai={ai}
        video={{ maxSeconds: VIDEO_MAX_SECONDS, maxBytes: VIDEO_MAX_BYTES }}
      />
    </>
  );
}
