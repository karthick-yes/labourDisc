import { Truck } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { sendReplacement } from "@/app/actions/placements";
import { ActionButton } from "@/components/ActionButton";
import { Avatar, EmptyState, MatchPlate, PageHeader } from "@/components/ui";
import { requireContractor } from "@/lib/auth/session";
import { matchesForNeed } from "@/lib/data/matching";
import { getNeed } from "@/lib/data/needs";
import { getPlacement } from "@/lib/data/placements";
import { getReference } from "@/lib/data/reference";
import { localName } from "@/lib/names";

// Pick another worker to send in place of one who failed during the trial.
// The paid commission moves to the new placement.
export default async function ReplacePage(props: PageProps<"/placements/[id]/replace">) {
  const contractor = await requireContractor();
  const { id } = await props.params;
  const p = await getPlacement(contractor.id, id);
  if (!p) notFound();
  if (p.status !== "trial") redirect(`/placements/${id}`);
  const [t, locale, ref, need] = await Promise.all([getTranslations(), getLocale(), getReference(), getNeed(contractor.id, p.needId)]);
  if (!need) notFound();
  const candidates = (await matchesForNeed(contractor, need)).filter((w) => w.id !== p.workerId);

  return (
    <div className="space-y-4">
      <PageHeader title={t("placements.replaceTitle")} back={{ href: `/placements/${id}`, label: p.workerName }} />
      <p className="text-[15px] text-ink-2">
        {t("placements.replaceHint", { shop: p.enterpriseName, skill: localName(locale, ref.skillById.get(p.skillId)) })}
      </p>
      {candidates.length ? (
        <ul className="space-y-2.5">
          {candidates.map((w) => (
            <li key={w.id} className="panel">
              <div className="strip text-base">
                <span className="min-w-0 break-words">{w.name}</span>
                <MatchPlate label={w.match.label} text={t(`match.label.${w.match.label}`)} score={w.match.score} />
              </div>
              <div className="flex items-center gap-3 p-3">
                <Avatar name={w.name} photoUrl={w.photoUrl} size={44} />
                <p className="min-w-0 flex-1 text-sm text-ink-2">
                  {localName(locale, ref.skillById.get(w.match.matchedSkillId))}
                  {w.match.years ? ` · ${t("workers.yearsShort", { years: w.match.years })}` : ""}
                  {w.expectedWage ? ` · ₹${w.expectedWage}` : ""}
                </p>
                <ActionButton action={sendReplacement.bind(null, id, w.id)} confirm={t("placements.replaceConfirm", { name: w.name })} className="btn btn-board btn-sm shrink-0">
                  <Truck className="size-4" aria-hidden />
                  {t("placements.sendThis")}
                </ActionButton>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title={t("match.noWorkers")} />
      )}
    </div>
  );
}
