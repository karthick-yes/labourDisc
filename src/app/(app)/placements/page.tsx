import { ChevronRight, Handshake } from "lucide-react";
import Link from "next/link";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { EmptyState, FilterChips, PageHeader, StatusPlate } from "@/components/ui";
import { requireContractor } from "@/lib/auth/session";
import { advanceCommissions, listPlacements, moneySummary, type PlacementFilter } from "@/lib/data/placements";
import { getReference } from "@/lib/data/reference";
import { localName } from "@/lib/names";
import { COMMISSION_TONE } from "@/lib/tones";

const FILTERS: PlacementFilter[] = ["unpaid", "trial", "earned"];

export default async function PlacementsPage(props: PageProps<"/placements">) {
  const contractor = await requireContractor();
  await advanceCommissions(contractor.id);
  const sp = await props.searchParams;
  const filter = FILTERS.find((f) => f === sp.filter);
  const [t, locale, ref, format, list, money] = await Promise.all([
    getTranslations(),
    getLocale(),
    getReference(),
    getFormatter(),
    listPlacements(contractor.id, filter),
    moneySummary(contractor.id),
  ]);
  const href = (f?: string) => (f ? `/placements?filter=${f}` : "/placements");
  const fmt = (d: Date) => format.dateTime(d, { day: "numeric", month: "short" });

  return (
    <div className="space-y-4">
      <PageHeader title={t("placements.title")} />

      <dl className="grid grid-cols-3 overflow-hidden rounded-board border-2 border-ink bg-ink [gap:2px]">
        <Link href={href("unpaid")} className="bg-board p-3">
          <dt className="text-sm leading-snug font-semibold text-ink-2">{t("home.toCollect")}</dt>
          <dd className="font-display tabular text-xl">₹{format.number(money.toCollect)}</dd>
        </Link>
        <Link href={href("trial")} className="bg-surface p-3">
          <dt className="text-sm leading-snug font-semibold text-ink-2">{t("home.atRisk")}</dt>
          <dd className="font-display tabular text-xl">₹{format.number(money.atRisk)}</dd>
        </Link>
        <Link href={href("earned")} className="bg-surface p-3">
          <dt className="text-sm leading-snug font-semibold text-ink-2">{t("home.earnedMonth")}</dt>
          <dd className="font-display tabular text-xl">₹{format.number(money.earnedThisMonth)}</dd>
        </Link>
      </dl>

      <FilterChips
        items={[
          { href: href(), label: t("common.all"), active: !filter },
          ...FILTERS.map((f) => ({ href: href(f), label: t(`placements.filter.${f}`), active: filter === f })),
        ]}
      />

      {list.length ? (
        <ul className="space-y-3">
          {list.map((p) => {
            const end = new Date(p.startDate);
            end.setDate(end.getDate() + p.probationDays);
            const when =
              p.status === "awaiting_payment"
                ? t("placements.notSentYet")
                : p.status === "trial"
                  ? t("placements.trialUntil", { date: fmt(end) })
                  : fmt(new Date(p.startDate));
            return (
              <li key={p.id}>
                <Link href={`/placements/${p.id}`} className="panel block active:opacity-90">
                  <div className="strip">
                    <span className="min-w-0 break-words">{p.workerName}</span>
                    <span className="font-display tabular shrink-0">₹{format.number(p.commissionAmount)}</span>
                  </div>
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <p className="font-semibold break-words">
                        {localName(locale, ref.skillById.get(p.skillId))}
                        <span className="font-normal text-ink-2"> · {p.enterpriseName}</span>
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <StatusPlate tone={COMMISSION_TONE[p.commissionStatus]}>{t(`placements.commission.${p.commissionStatus}`)}</StatusPlate>
                        <span className="text-ink-2">{when}</span>
                      </div>
                    </div>
                    <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState icon={<Handshake className="size-6" aria-hidden />} title={t("placements.empty")} body={t("placements.emptyHint")} />
      )}
    </div>
  );
}
