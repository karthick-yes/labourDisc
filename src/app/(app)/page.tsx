import { ArrowRight, ClipboardPlus, Map, MapPin, UserPlus } from "lucide-react";
import Link from "next/link";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { DemoControls } from "@/components/DemoControls";
import { InstallApp } from "@/components/InstallApp";
import { NeedRow } from "@/components/rows";
import { SearchBox, SectionTitle } from "@/components/ui";
import { requireContractor } from "@/lib/auth/session";
import { countEnterprises } from "@/lib/data/enterprises";
import { getHomeStats } from "@/lib/data/home";
import { listNeeds } from "@/lib/data/needs";
import { advanceCommissions, moneySummary } from "@/lib/data/placements";
import { maybeDistanceKm } from "@/lib/geo";
import { matchesForNeed } from "@/lib/data/matching";
import { localArea } from "@/lib/names";

export default async function HomePage() {
  const contractor = await requireContractor();
  await advanceCommissions(contractor.id);
  const [t, locale, format, stats, money, enterpriseCount, latestNeeds] = await Promise.all([
    getTranslations(),
    getLocale(),
    getFormatter(),
    getHomeStats(contractor.id),
    moneySummary(contractor.id),
    countEnterprises(contractor.id),
    listNeeds(contractor.id, { status: "open", limit: 4 }),
  ]);
  const base = { lat: contractor.baseLat, lng: contractor.baseLng };
  // Best available match per latest need, for the strong-match plate.
  const best = await Promise.all(latestNeeds.map((n) => matchesForNeed(contractor, n).then((m) => m[0]?.match ?? null)));
  const isEmpty = enterpriseCount === 0 && stats.availableWorkers === 0;

  return (
    <div className="space-y-5">
      {/* The day's board: area on the left, open needs on the right. */}
      <Link href="/needs" className="flex items-center justify-between gap-3 rounded-board bg-ink px-4 py-3 text-board active:opacity-90">
        <span className="font-display flex min-w-0 items-center gap-2 text-xl">
          <MapPin className="size-5 shrink-0" aria-hidden />
          <span className="truncate">{localArea(locale, contractor.areaName) ?? t("home.noArea")}</span>
        </span>
        <span className="font-display tabular shrink-0 text-xl">
          {format.number(stats.openNeeds)} <span className="text-base text-board/85">{t("home.needsShort")}</span>
        </span>
      </Link>

      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/workers/new"
          className="flex min-h-[7.5rem] flex-col justify-between rounded-board border-2 border-ink bg-board p-3.5 text-ink active:translate-y-0.5"
        >
          <UserPlus className="size-8" strokeWidth={2.25} aria-hidden />
          <span className="font-display text-[1.45rem] leading-[1.1]">{t("home.newWorker")}</span>
        </Link>
        <Link
          href="/needs/new"
          className="flex min-h-[7.5rem] flex-col justify-between rounded-board border-2 border-ink bg-bus p-3.5 text-white active:translate-y-0.5"
        >
          <ClipboardPlus className="size-8" strokeWidth={2.25} aria-hidden />
          <span className="font-display text-[1.45rem] leading-[1.1]">{t("home.newNeed")}</span>
        </Link>
      </div>

      <SearchBox action="/search" placeholder={t("home.searchPlaceholder")} />

      {isEmpty && (
        <div className="panel">
          <div className="strip">{t("home.emptyTitle")}</div>
          <div className="space-y-3 p-4">
            <p className="text-[15px]">{t("home.emptyBody")}</p>
            {contractor.baseLat == null ? (
              <Link href="/settings" className="btn btn-ink w-full">
                <MapPin className="size-5" aria-hidden />
                {t("home.noLocation")}
              </Link>
            ) : (
              <DemoControls hasDemo={false} compact />
            )}
            <Link href="/enterprises/find" className="btn btn-outline w-full">
              {t("find.cta")}
            </Link>
          </div>
        </div>
      )}

      {/* Today's figures as one board: money in yellow, everything tappable. */}
      <dl className="grid grid-cols-2 overflow-hidden rounded-board border-2 border-ink bg-ink [gap:2px]">
        <Figure href="/workers?status=available" label={t("home.availableWorkers")} value={format.number(stats.availableWorkers)} />
        <Figure href="/placements?filter=trial" label={t("home.trialsEnding")} value={format.number(stats.trialsEndingSoon)} alert={stats.trialsEndingSoon > 0} />
        <Figure
          href="/placements?filter=unpaid"
          label={t("home.toCollect")}
          value={`₹${format.number(money.toCollect)}`}
          money
          wide
          note={money.toCollectCount > 0 ? t("home.waitingPayment", { count: money.toCollectCount }) : undefined}
        />
        <Figure href="/placements?filter=trial" label={t("home.atRisk")} value={`₹${format.number(money.atRisk)}`} />
        <Figure href="/placements?filter=earned" label={t("home.earnedMonth")} value={`₹${format.number(money.earnedThisMonth)}`} />
      </dl>

      {latestNeeds.length > 0 && (
        <section>
          <SectionTitle
            action={
              <Link href="/needs" aria-label={t("common.seeAll")} className="flex size-10 items-center justify-center rounded-board border-2 border-ink bg-surface">
                <ArrowRight className="size-5" aria-hidden />
              </Link>
            }
          >
            {t("home.latestNeeds")}
          </SectionTitle>
          <div className="space-y-3">
            {latestNeeds.map((n, i) => (
              <NeedRow
                key={n.id}
                need={n}
                bestMatch={best[i]}
                distanceKm={maybeDistanceKm({ lat: n.enterpriseLat, lng: n.enterpriseLng }, base)}
              />
            ))}
          </div>
        </section>
      )}

      {!isEmpty && (
        <Link href="/map" className="btn btn-outline w-full">
          <Map className="size-5" aria-hidden />
          {t("map.open")}
        </Link>
      )}

      <InstallApp />
    </div>
  );
}

function Figure({
  href,
  label,
  value,
  note,
  money,
  wide,
  alert,
}: {
  href: string;
  label: string;
  value: string;
  note?: string;
  money?: boolean;
  wide?: boolean;
  alert?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col justify-between gap-1 p-3.5 active:opacity-90 ${wide ? "col-span-2" : ""} ${
        money ? "bg-board" : "bg-surface"
      }`}
    >
      <dt className="text-[15px] leading-snug font-semibold text-ink-2">{label}</dt>
      <dd className="flex items-baseline justify-between gap-2">
        <span className={`font-display tabular text-[2rem] leading-none ${alert ? "text-bus" : ""}`}>{value}</span>
        {note && <span className="text-sm font-semibold text-ink-2">{note}</span>}
      </dd>
    </Link>
  );
}
