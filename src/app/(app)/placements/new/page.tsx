import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui";
import { requireContractor } from "@/lib/auth/session";
import { placementDraft } from "@/lib/data/placements";
import { getReference } from "@/lib/data/reference";
import { localName } from "@/lib/names";
import { PlacementForm } from "./PlacementForm";

export default async function NewPlacementPage(props: PageProps<"/placements/new">) {
  const contractor = await requireContractor();
  const sp = await props.searchParams;
  const workerId = typeof sp.worker === "string" ? sp.worker : "";
  const needId = typeof sp.need === "string" ? sp.need : "";
  const uuid = /^[0-9a-f-]{36}$/;
  if (!uuid.test(workerId) || !uuid.test(needId)) notFound();
  const [t, locale, ref, draft] = await Promise.all([
    getTranslations(),
    getLocale(),
    getReference(),
    placementDraft(contractor.id, workerId, needId),
  ]);
  if (!draft) notFound();
  const wage = draft.needWage ?? draft.workerWage ?? 0;
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

  return (
    <>
      <PageHeader title={t("placements.newTitle")} back={{ href: `/workers/${workerId}`, label: draft.workerName }} />
      <PlacementForm
        workerId={workerId}
        needId={needId}
        summary={{
          worker: draft.workerName,
          enterprise: draft.enterpriseName,
          skill: localName(locale, ref.skillById.get(draft.skillId)),
        }}
        defaults={{ startDate: today, wage, commission: wage, probationDays: contractor.defaultProbationDays }}
      />
    </>
  );
}
