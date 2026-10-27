import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui";
import { VIDEO_MAX_BYTES, VIDEO_MAX_SECONDS } from "@/config/limits";
import { requireContractor } from "@/lib/auth/session";
import { getSkills } from "@/lib/data/reference";
import { getWorker } from "@/lib/data/workers";
import { localName } from "@/lib/names";
import { WorkerForm } from "../../WorkerForm";

export default async function EditWorkerPage(props: PageProps<"/workers/[id]/edit">) {
  const contractor = await requireContractor();
  const { id } = await props.params;
  const [t, locale, skills, worker] = await Promise.all([getTranslations(), getLocale(), getSkills(), getWorker(contractor.id, id)]);
  if (!worker) notFound();

  return (
    <>
      <PageHeader title={t("workers.editTitle")} back={{ href: `/workers/${id}`, label: worker.name }} />
      <WorkerForm
        skillOptions={skills.map((s) => ({ id: s.id, label: localName(locale, s) }))}
        ai={{ available: false, reason: "edit" }}
        video={{ maxSeconds: VIDEO_MAX_SECONDS, maxBytes: VIDEO_MAX_BYTES }}
        initial={{
          id: worker.id,
          name: worker.name,
          photoUrl: worker.photoUrl,
          homeState: worker.homeState,
          languages: worker.languages,
          expectedWage: worker.expectedWage,
          availability: worker.availability,
          notes: worker.notes,
          mediaConsent: worker.mediaConsent,
          skills: worker.skills,
          hasVideo: Boolean(worker.videoUrl),
        }}
      />
    </>
  );
}
