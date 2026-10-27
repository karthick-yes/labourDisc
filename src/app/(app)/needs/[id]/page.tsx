import { CircleCheck, CircleX, Pencil, RotateCcw, Trash2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { changeNeedStatus, removeNeed } from "@/app/actions/needs";
import { ActionButton } from "@/components/ActionButton";
import { ContactButtons } from "@/components/ContactButtons";
import { WorkerMatchList } from "@/components/MatchCards";
import { EmptyState, Notice, PageHeader, SectionTitle, StatusPlate } from "@/components/ui";
import { requireContractor } from "@/lib/auth/session";
import { matchesForNeed } from "@/lib/data/matching";
import { getNeed } from "@/lib/data/needs";
import { getReference } from "@/lib/data/reference";
import { maybeDistanceKm } from "@/lib/geo";
import { formatKm, localArea, localName } from "@/lib/names";
import { NEED_STATUS_TONE } from "@/lib/tones";

export default async function NeedPage(props: PageProps<"/needs/[id]">) {
  const contractor = await requireContractor();
  const [{ id }, sp] = await Promise.all([props.params, props.searchParams]);
  const need = await getNeed(contractor.id, id);
  if (!need) notFound();

  const [t, locale, ref, format, matches] = await Promise.all([
    getTranslations(),
    getLocale(),
    getReference(),
    getFormatter(),
    need.status === "open" ? matchesForNeed(contractor, need) : Promise.resolve([]),
  ]);
  const skill = ref.skillById.get(need.skillId);
  const km = maybeDistanceKm({ lat: need.enterpriseLat, lng: need.enterpriseLng }, { lat: contractor.baseLat, lng: contractor.baseLng });
  const isNew = sp.new === "1";

  const matchesSection = (
    <section>
      <SectionTitle count={matches.length}>{t("match.matchingWorkers")}</SectionTitle>
      {need.status !== "open" ? (
        <EmptyState title={t("match.needClosed")} />
      ) : matches.length ? (
        <WorkerMatchList contractor={contractor} need={need} matches={matches} />
      ) : (
        <EmptyState
          title={t("match.noWorkers")}
          action={
            <Link href="/workers/new" className="btn btn-board">
              {t("home.newWorker")}
            </Link>
          }
        />
      )}
    </section>
  );

  return (
    <div className="space-y-5">
      <PageHeader title={localName(locale, skill)} back={{ href: "/needs", label: t("needs.title") }} />

      {isNew && (
        <>
          <Notice>{t("needs.savedShowingMatches")}</Notice>
          {matchesSection}
        </>
      )}

      <section className="panel">
        <Link href={`/enterprises/${need.enterpriseId}`} className="strip">
          <span className="min-w-0 break-words">{need.enterpriseName}</span>
          <StatusPlate tone={NEED_STATUS_TONE[need.status]}>{t(`needs.status.${need.status}`)}</StatusPlate>
        </Link>
        <div className="space-y-4 p-4">
          <p className="text-[15px] text-ink-2">
            {need.enterpriseCategoryId && localName(locale, ref.categoryById.get(need.enterpriseCategoryId))}
            {need.enterpriseArea && ` · ${localArea(locale, need.enterpriseArea)}`}
            {km != null && <span className="tabular"> · {formatKm(km)}</span>}
          </p>
          <dl className="grid grid-cols-3 overflow-hidden rounded-board border-2 border-ink bg-ink text-center [gap:2px]">
            <div className="bg-surface p-2.5">
              <dt className="text-sm text-ink-2">{t("needs.count")}</dt>
              <dd className="font-display tabular text-2xl">
                {need.countFilled}/{need.countNeeded}
              </dd>
            </div>
            <div className="bg-board p-2.5">
              <dt className="text-sm text-ink-2">{t("needs.wageOffered")}</dt>
              <dd className="font-display tabular text-2xl">{need.wageOffered ? `₹${need.wageOffered}` : "—"}</dd>
            </div>
            <div className="bg-surface p-2.5">
              <dt className="text-sm text-ink-2">{t("needs.startDate")}</dt>
              <dd className="font-display text-2xl">
                {need.startDate ? format.dateTime(new Date(need.startDate), { day: "numeric", month: "short" }) : "—"}
              </dd>
            </div>
          </dl>
          {need.notes && <p className="text-[15px] whitespace-pre-line">{need.notes}</p>}
          <ContactButtons phone={need.enterprisePhone} sample={need.isDemo} />
        </div>
        <div className="grid grid-cols-3 gap-2 border-t-2 border-ground p-3">
          {need.status === "open" ? (
            <>
              <ActionButton action={changeNeedStatus.bind(null, need.id, "filled")} className="btn btn-outline btn-sm">
                <CircleCheck className="size-4" aria-hidden />
                {t("needs.markFilled")}
              </ActionButton>
              <ActionButton action={changeNeedStatus.bind(null, need.id, "cancelled")} className="btn btn-outline btn-sm">
                <CircleX className="size-4" aria-hidden />
                {t("needs.cancel")}
              </ActionButton>
            </>
          ) : (
            <ActionButton action={changeNeedStatus.bind(null, need.id, "open")} className="btn btn-outline btn-sm col-span-2">
              <RotateCcw className="size-4" aria-hidden />
              {t("needs.reopen")}
            </ActionButton>
          )}
          <Link href={`/needs/${need.id}/edit`} className="btn btn-outline btn-sm">
            <Pencil className="size-4" aria-hidden />
            {t("common.edit")}
          </Link>
        </div>
      </section>

      {!isNew && matchesSection}

      <ActionButton action={removeNeed.bind(null, need.id)} confirm={t("needs.deleteConfirm")} className="btn btn-danger w-full">
        <Trash2 className="size-5" aria-hidden />
        {t("needs.delete")}
      </ActionButton>
    </div>
  );
}
