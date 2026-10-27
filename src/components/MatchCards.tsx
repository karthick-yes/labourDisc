import { CalendarDays, Check, Handshake, MapPin, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import type { CurrentContractor } from "@/lib/auth/session";
import type { NeedMatch, WorkerMatch } from "@/lib/data/matching";
import { getReference } from "@/lib/data/reference";
import { formatKm, localArea, localName } from "@/lib/names";
import { profileUrl, workerCardMessage } from "@/lib/share";
import { getBaseUrl } from "@/lib/url";
import { ContactButtons } from "./ContactButtons";
import { Avatar, MatchPlate, Stars } from "./ui";

// Match results (brief §3 Flow C). Each card: a board strip with the match
// plate, then skill fit, distance, wage comparison, rating, and the actions:
// Call + Send on WhatsApp to the shop, and Mark placed.

type T = (k: string, v?: Record<string, string | number>) => string;

// Fit lines stay in ink; a check or warning icon carries the meaning, so
// green stays reserved for WhatsApp and paid/confirmed states.
function WageCompare({ offered, expected, t }: { offered: number | null; expected: number | null; t: T }) {
  if (offered == null && expected == null) return null;
  const fits = offered != null && expected != null && expected <= offered;
  const over = offered != null && expected != null && expected > offered;
  return (
    <span className="tabular inline-flex items-center gap-1 text-ink">
      {fits && <Check className="size-4 shrink-0" strokeWidth={3} aria-hidden />}
      {over && <TriangleAlert className="size-4 shrink-0 text-bus" aria-hidden />}
      <span>
        {offered != null && t("match.offered", { amount: offered })}
        {offered != null && expected != null && " · "}
        {expected != null && t("match.asks", { amount: expected })}
      </span>
    </span>
  );
}

function SkillFit({ exact, label, t }: { exact: boolean; label: string; t: T }) {
  return (
    <span className="inline-flex items-center gap-1 font-semibold text-ink">
      {exact ? <Check className="size-4 shrink-0" strokeWidth={3} aria-hidden /> : <span aria-hidden>≈</span>}
      {exact ? t("match.skill.exact", { skill: label }) : t("match.skill.related", { skill: label })}
    </span>
  );
}

/** Needs that fit one worker (shown on the worker's page). */
export async function NeedMatchList({
  contractor,
  worker,
  matches,
}: {
  contractor: CurrentContractor;
  worker: { id: string; name: string; expectedWage: number | null; shareToken: string | null; isDemo: boolean };
  matches: NeedMatch[];
}) {
  const [t, locale, ref, format, baseUrl] = await Promise.all([
    getTranslations(),
    getLocale(),
    getReference(),
    getFormatter(),
    getBaseUrl(),
  ]);

  return (
    <ul className="space-y-3">
      {matches.map((m) => {
        const skill = ref.skillById.get(m.match.matchedSkillId);
        const message = worker.shareToken
          ? workerCardMessage({
              workerName: worker.name,
              skillMl: skill?.nameMl ?? "",
              years: m.match.years,
              wage: worker.expectedWage,
              profileUrl: profileUrl(baseUrl, worker.shareToken),
              contractorName: contractor.name,
              contractorPhone: contractor.phone,
            })
          : undefined;
        const remaining = m.countNeeded - m.countFilled;
        return (
          <li key={m.needId} className="panel">
            <Link href={`/needs/${m.needId}`} className="strip">
              <span className="min-w-0 break-words">{m.enterpriseName}</span>
              <MatchPlate label={m.match.label} text={t(`match.label.${m.match.label}`)} score={m.match.score} />
            </Link>
            <div className="space-y-3 p-3">
              <p className="text-[15px]">
                <span className="font-bold">
                  {localName(locale, ref.skillById.get(m.skillId))}
                  {remaining > 1 && <span className="tabular"> ×{remaining}</span>}
                </span>
                {m.enterpriseArea && <span className="text-ink-2"> · {localArea(locale, m.enterpriseArea)}</span>}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[15px]">
                <SkillFit exact={m.match.skillMatch === "exact"} label={localName(locale, skill)} t={t} />
                {m.distanceKm != null && (
                  <span className="tabular inline-flex items-center gap-1 text-ink-2">
                    <MapPin className="size-4" aria-hidden />
                    {formatKm(m.distanceKm)}
                  </span>
                )}
                <WageCompare offered={m.wageOffered} expected={worker.expectedWage} t={t} />
                {m.startDate && (
                  <span className="inline-flex items-center gap-1 text-ink-2">
                    <CalendarDays className="size-4" aria-hidden />
                    {format.dateTime(new Date(m.startDate), { day: "numeric", month: "short" })}
                  </span>
                )}
              </div>
              <ContactButtons phone={m.enterprisePhone} sample={worker.isDemo || m.isDemo} message={message} compact />
              <Link href={`/placements/new?worker=${worker.id}&need=${m.needId}`} className="btn btn-outline btn-sm w-full">
                <Handshake className="size-4" aria-hidden />
                {t("placements.markPlaced")}
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Workers that fit one need (shown on the need's page). */
export async function WorkerMatchList({
  contractor,
  need,
  matches,
}: {
  contractor: CurrentContractor;
  need: { id: string; wageOffered: number | null; enterprisePhone: string | null; isDemo: boolean };
  matches: WorkerMatch[];
}) {
  const [t, locale, ref, baseUrl] = await Promise.all([getTranslations(), getLocale(), getReference(), getBaseUrl()]);

  return (
    <ul className="space-y-3">
      {matches.map((w) => {
        const skill = ref.skillById.get(w.match.matchedSkillId);
        const message = w.shareToken
          ? workerCardMessage({
              workerName: w.name,
              skillMl: skill?.nameMl ?? "",
              years: w.match.years,
              wage: w.expectedWage,
              profileUrl: profileUrl(baseUrl, w.shareToken),
              contractorName: contractor.name,
              contractorPhone: contractor.phone,
            })
          : undefined;
        return (
          <li key={w.id} className="panel">
            <Link href={`/workers/${w.id}`} className="strip">
              <span className="min-w-0 break-words">{w.name}</span>
              <MatchPlate label={w.match.label} text={t(`match.label.${w.match.label}`)} score={w.match.score} />
            </Link>
            <div className="space-y-3 p-3">
              <div className="flex items-center gap-3">
                <Avatar name={w.name} photoUrl={w.photoUrl} size={44} />
                <p className="min-w-0 text-[15px] text-ink-2">
                  {w.homeState ?? ""}
                  {w.distanceKm != null && (
                    <span className="tabular ml-2 inline-flex items-center gap-1">
                      <MapPin className="size-4" aria-hidden />
                      {formatKm(w.distanceKm)}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[15px]">
                <SkillFit
                  exact={w.match.skillMatch === "exact"}
                  label={`${localName(locale, skill)}${w.match.years ? ` · ${t("workers.yearsShort", { years: w.match.years })}` : ""}`}
                  t={t}
                />
                <WageCompare offered={need.wageOffered} expected={w.expectedWage} t={t} />
                <Stars avg={w.rating.avg} count={w.rating.count} label={t("workers.ratedBy", { count: w.rating.count })} />
              </div>
              <ContactButtons phone={need.enterprisePhone} sample={w.isDemo || need.isDemo} message={message} compact />
              <Link href={`/placements/new?worker=${w.id}&need=${need.id}`} className="btn btn-outline btn-sm w-full">
                <Handshake className="size-4" aria-hidden />
                {t("placements.markPlaced")}
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
