import { Ban, Eye, Link2, Pencil, RefreshCw, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { changeAvailability, newShareLink, removeWorker, revokeShareLink } from "@/app/actions/workers";
import { ActionButton } from "@/components/ActionButton";
import { CopyButton } from "@/components/CopyButton";
import { NeedMatchList } from "@/components/MatchCards";
import { Avatar, EmptyState, Notice, PageHeader, SectionTitle, Stars, StatusPlate } from "@/components/ui";
import { requireContractor } from "@/lib/auth/session";
import { matchesForWorker } from "@/lib/data/matching";
import { listPlacements } from "@/lib/data/placements";
import { getReference } from "@/lib/data/reference";
import { getWorker } from "@/lib/data/workers";
import { localName } from "@/lib/names";
import { profileUrl } from "@/lib/share";
import { AVAILABILITY_TONE, COMMISSION_TONE, PLACEMENT_STATUS_TONE } from "@/lib/tones";
import { getBaseUrl } from "@/lib/url";

export default async function WorkerPage(props: PageProps<"/workers/[id]">) {
  const contractor = await requireContractor();
  const [{ id }, sp] = await Promise.all([props.params, props.searchParams]);
  const worker = await getWorker(contractor.id, id);
  if (!worker) notFound();

  const [t, locale, ref, format, baseUrl, matches, jobs] = await Promise.all([
    getTranslations(),
    getLocale(),
    getReference(),
    getFormatter(),
    getBaseUrl(),
    matchesForWorker(contractor, worker),
    listPlacements(contractor.id, undefined, id),
  ]);
  const isNew = sp.new === "1";
  const link = worker.shareToken ? profileUrl(baseUrl, worker.shareToken) : null;

  const matchesSection = (
    <section>
      <SectionTitle count={matches.length}>{t("match.matchingNeeds")}</SectionTitle>
      {worker.availability !== "available" ? (
        <EmptyState title={t("match.notAvailable")} />
      ) : matches.length ? (
        <NeedMatchList contractor={contractor} worker={worker} matches={matches} />
      ) : (
        <EmptyState
          title={t("match.noNeeds")}
          action={
            <Link href="/needs/new" className="btn btn-outline">
              {t("home.newNeed")}
            </Link>
          }
        />
      )}
    </section>
  );

  return (
    <div className="space-y-5">
      <PageHeader title={worker.name} back={{ href: "/workers", label: t("workers.title") }} />

      {isNew && (
        <>
          <Notice>{t("workers.savedShowingMatches")}</Notice>
          {matchesSection}
        </>
      )}

      <section className="panel">
        <div className="flex gap-4 p-4">
          <Avatar name={worker.name} photoUrl={worker.photoUrl} size={88} />
          <div className="min-w-0 space-y-1.5">
            <StatusPlate tone={AVAILABILITY_TONE[worker.availability]}>{t(`workers.availability.${worker.availability}`)}</StatusPlate>
            {worker.expectedWage && (
              <p className="font-display tabular text-2xl">
                ₹{format.number(worker.expectedWage)}
                <span className="text-base text-muted">/{t("common.day")}</span>
              </p>
            )}
            <Stars avg={worker.rating.avg} count={worker.rating.count} label={t("workers.ratedBy", { count: worker.rating.count })} />
          </div>
        </div>

        <ul className="flex flex-wrap gap-2 px-4">
          {worker.skills.map((s) => (
            <li key={s.skillId} className="plate bg-board px-2.5 py-1 text-[15px] text-ink">
              {localName(locale, ref.skillById.get(s.skillId))}
              {s.years ? <span className="tabular font-semibold">· {t("workers.yearsShort", { years: s.years })}</span> : null}
            </li>
          ))}
        </ul>

        <dl className="grid grid-cols-2 gap-3 p-4 text-[15px]">
          {worker.homeState && (
            <div>
              <dt className="text-muted">{t("workers.homeState")}</dt>
              <dd className="font-semibold">{worker.homeState}</dd>
            </div>
          )}
          {worker.languages.length > 0 && (
            <div>
              <dt className="text-muted">{t("workers.languages")}</dt>
              <dd className="font-semibold">{worker.languages.join(", ")}</dd>
            </div>
          )}
        </dl>
        {worker.notes && <p className="px-4 pb-4 text-[15px] whitespace-pre-line">{worker.notes}</p>}
        {worker.videoUrl && (
          <video src={worker.videoUrl} controls playsInline preload="metadata" className="aspect-video w-full border-t-2 border-ink bg-ink" />
        )}

        <div className="grid grid-cols-3 gap-2 border-t-2 border-ground p-3">
          {(["available", "placed", "inactive"] as const)
            .filter((a) => a !== worker.availability)
            .map((a) => (
              <ActionButton key={a} action={changeAvailability.bind(null, worker.id, a)} className="btn btn-outline btn-sm">
                {t(`workers.setAvailability.${a}`)}
              </ActionButton>
            ))}
          <Link href={`/workers/${worker.id}/edit`} className="btn btn-outline btn-sm">
            <Pencil className="size-4" aria-hidden />
            {t("common.edit")}
          </Link>
        </div>
      </section>

      {jobs.length > 0 && (
        <section>
          <SectionTitle count={jobs.length}>{t("placements.title")}</SectionTitle>
          <ul className="space-y-2.5">
            {jobs.map((j) => (
              <li key={j.id}>
                <Link href={`/placements/${j.id}`} className="panel block active:opacity-90">
                  <div className="strip text-base">
                    <span className="min-w-0 break-words">{j.enterpriseName}</span>
                    <span className="font-display tabular shrink-0">₹{format.number(j.commissionAmount)}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 text-sm">
                    <span className="font-semibold">{localName(locale, ref.skillById.get(j.skillId))}</span>
                    <StatusPlate tone={PLACEMENT_STATUS_TONE[j.status]}>{t(`placements.status.${j.status}`)}</StatusPlate>
                    <StatusPlate tone={COMMISSION_TONE[j.commissionStatus]}>{t(`placements.commission.${j.commissionStatus}`)}</StatusPlate>
                    <span className="text-ink-2">{format.dateTime(new Date(j.startDate), { day: "numeric", month: "short" })}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!isNew && matchesSection}

      <section className="panel">
        <div className="strip">
          <span className="inline-flex items-center gap-2">
            <Link2 className="size-5" aria-hidden />
            {t("workers.profileLink")}
          </span>
        </div>
        <div className="space-y-3 p-4">
          <p className="text-[15px] text-ink-2">{t("workers.profileLinkHint")}</p>
          {!worker.mediaConsent && <p className="text-[15px] font-semibold text-ink">{t("workers.noConsentNote")}</p>}
          {link ? (
            <>
              <p className="rounded-md bg-ground p-2 font-mono text-[13px] break-all">{link}</p>
              <div className="grid grid-cols-2 gap-2">
                <CopyButton text={link} label={t("workers.copyLink")} doneLabel={t("workers.copied")} />
                <a href={link} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                  <Eye className="size-4" aria-hidden />
                  {t("workers.openLink")}
                </a>
                <ActionButton action={newShareLink.bind(null, worker.id)} confirm={t("workers.newLinkConfirm")} className="btn btn-outline btn-sm">
                  <RefreshCw className="size-4" aria-hidden />
                  {t("workers.newLink")}
                </ActionButton>
                <ActionButton action={revokeShareLink.bind(null, worker.id)} confirm={t("workers.revokeConfirm")} className="btn btn-danger btn-sm">
                  <Ban className="size-4" aria-hidden />
                  {t("workers.revokeLink")}
                </ActionButton>
              </div>
            </>
          ) : (
            <ActionButton action={newShareLink.bind(null, worker.id)} className="btn btn-ink w-full">
              <Link2 className="size-5" aria-hidden />
              {t("workers.createLink")}
            </ActionButton>
          )}
        </div>
      </section>

      {worker.ratingNotes.length > 0 && (
        <section>
          <SectionTitle>{t("workers.employerFeedback")}</SectionTitle>
          <ul className="panel divide-y-2 divide-ground">
            {worker.ratingNotes.map((r, i) => (
              <li key={i} className="flex items-start gap-3 px-4 py-3 text-[15px]">
                <span className="inline-flex shrink-0 items-center gap-0.5" aria-label={t("rating.stars", { count: r.score })}>
                  {Array.from({ length: 5 }, (_, n) => (
                    <Star key={n} className={`size-4 ${n < r.score ? "fill-board-dark text-board-dark" : "text-line"}`} aria-hidden />
                  ))}
                </span>
                {r.note && <span>{r.note}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {worker.transcript && (
        <details className="panel p-4 text-[15px]">
          <summary className="cursor-pointer font-semibold">{t("voice.heard")}</summary>
          <p className="mt-2 rounded-md bg-ground p-2">{worker.transcript}</p>
          {worker.voiceNoteUrl && <audio src={worker.voiceNoteUrl} controls preload="none" className="mt-2 w-full" />}
        </details>
      )}

      <ActionButton action={removeWorker.bind(null, worker.id)} confirm={t("workers.deleteConfirm")} className="btn btn-danger w-full">
        <Trash2 className="size-5" aria-hidden />
        {t("workers.delete")}
      </ActionButton>
    </div>
  );
}
