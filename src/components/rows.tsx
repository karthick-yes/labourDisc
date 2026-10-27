import { CalendarDays, ChevronRight, IndianRupee, MapPin } from "lucide-react";
import Link from "next/link";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import type { EnterpriseListItem } from "@/lib/data/enterprises";
import type { NeedListItem } from "@/lib/data/needs";
import { getReference } from "@/lib/data/reference";
import type { WorkerListItem } from "@/lib/data/workers";
import { formatKm, localArea, localName } from "@/lib/names";
import type { MatchLabel } from "@/lib/matching/score";
import { AVAILABILITY_TONE, NEED_STATUS_TONE } from "@/lib/tones";
import { Avatar, MatchPlate, Stars, StatusPlate } from "./ui";

// List rows. Needs use the board strip (skill × count on yellow); workers and
// shops are plain white rows with a heavy name line.


export async function WorkerRow({ worker }: { worker: WorkerListItem }) {
  const [t, locale, ref] = await Promise.all([getTranslations(), getLocale(), getReference()]);
  return (
    <Link href={`/workers/${worker.id}`} className="panel flex items-center gap-3 p-3 active:bg-ground">
      <Avatar name={worker.name} photoUrl={worker.photoUrl} size={52} />
      <div className="min-w-0 flex-1">
        <p className="font-display truncate text-lg">{worker.name}</p>
        <p className="truncate text-[15px] text-ink-2">
          {worker.skills.map((s) => localName(locale, ref.skillById.get(s.skillId))).join(" · ") || "—"}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <StatusPlate tone={AVAILABILITY_TONE[worker.availability]}>{t(`workers.availability.${worker.availability}`)}</StatusPlate>
          {worker.expectedWage && (
            <span className="tabular text-sm font-semibold">
              ₹{worker.expectedWage}
              <span className="font-normal text-muted">/{t("common.day")}</span>
            </span>
          )}
          <Stars avg={worker.rating.avg} count={worker.rating.count} label={t("workers.ratedBy", { count: worker.rating.count })} />
        </div>
      </div>
      <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
    </Link>
  );
}

export async function NeedRow({
  need,
  distanceKm,
  bestMatch,
}: {
  need: NeedListItem;
  distanceKm?: number | null;
  bestMatch?: { label: MatchLabel; score: number } | null;
}) {
  const [t, locale, ref, format] = await Promise.all([getTranslations(), getLocale(), getReference(), getFormatter()]);
  const remaining = need.countNeeded - need.countFilled;
  return (
    <Link href={`/needs/${need.id}`} className="panel block active:opacity-90">
      <div className="strip">
        <span className="flex min-w-0 items-center gap-2">
          {/* Count in its own box, like a bus route number. */}
          {remaining > 1 && (
            <span className="tabular flex size-8 shrink-0 items-center justify-center rounded-md bg-ink text-board" aria-label={`× ${remaining}`}>
              {remaining}
            </span>
          )}
          <span className="min-w-0 break-words">{localName(locale, ref.skillById.get(need.skillId))}</span>
        </span>
        {need.status !== "open" ? (
          <StatusPlate tone={NEED_STATUS_TONE[need.status]}>{t(`needs.status.${need.status}`)}</StatusPlate>
        ) : bestMatch?.label === "strong" ? (
          <MatchPlate label="strong" text={t("match.label.strong")} score={bestMatch.score} />
        ) : null}
      </div>
      <div className="space-y-1 px-3 py-2.5">
        <p className="truncate font-semibold">
          {need.enterpriseName}
          {need.enterpriseArea && <span className="font-normal text-ink-2"> · {localArea(locale, need.enterpriseArea)}</span>}
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[15px] text-ink-2">
          {need.wageOffered && (
            <span className="tabular inline-flex items-center gap-1 font-semibold text-ink">
              <IndianRupee className="size-4" aria-hidden />
              {need.wageOffered}/{t("common.day")}
            </span>
          )}
          {distanceKm != null && (
            <span className="tabular inline-flex items-center gap-1">
              <MapPin className="size-4" aria-hidden />
              {formatKm(distanceKm)}
            </span>
          )}
          {need.startDate && (
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="size-4" aria-hidden />
              {format.dateTime(new Date(need.startDate), { day: "numeric", month: "short" })}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export async function EnterpriseRow({ enterprise, distanceKm }: { enterprise: EnterpriseListItem; distanceKm?: number | null }) {
  const [t, locale, ref] = await Promise.all([getTranslations(), getLocale(), getReference()]);
  return (
    <Link href={`/enterprises/${enterprise.id}`} className="panel flex items-center gap-3 p-3 active:bg-ground">
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-bold">{enterprise.name}</p>
        <p className="truncate text-[15px] text-ink-2">
          {localName(locale, enterprise.categoryId ? ref.categoryById.get(enterprise.categoryId) : null)}
          {enterprise.areaName && ` · ${localArea(locale, enterprise.areaName)}`}
          {distanceKm != null && <span className="tabular"> · {formatKm(distanceKm)}</span>}
        </p>
      </div>
      {enterprise.openNeeds > 0 && <StatusPlate tone="warn">{t("enterprises.openNeeds", { count: enterprise.openNeeds })}</StatusPlate>}
      <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
    </Link>
  );
}
