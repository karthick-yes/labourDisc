import { Ban, BadgeIndianRupee, CircleCheck, Flag, MessageCircle, RotateCcw, Truck, UserRoundPlus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { placementAction } from "@/app/actions/placements";
import { ActionButton } from "@/components/ActionButton";
import { InfoButton } from "@/components/InfoSheet";
import { Avatar, Notice, PageHeader, StatusPlate } from "@/components/ui";
import { requireContractor } from "@/lib/auth/session";
import { advanceCommissions, getPlacement } from "@/lib/data/placements";
import { getReference } from "@/lib/data/reference";
import { localName } from "@/lib/names";
import { paymentRequestMessage, whatsappUrl } from "@/lib/share";
import { COMMISSION_TONE, PLACEMENT_STATUS_TONE } from "@/lib/tones";
import { RatingPicker } from "./RatingPicker";

export default async function PlacementPage(props: PageProps<"/placements/[id]">) {
  const contractor = await requireContractor();
  const [{ id }, sp] = await Promise.all([props.params, props.searchParams]);
  await advanceCommissions(contractor.id);
  const p = await getPlacement(contractor.id, id);
  if (!p) notFound();
  const [t, locale, ref, format] = await Promise.all([getTranslations(), getLocale(), getReference(), getFormatter()]);

  const skill = ref.skillById.get(p.skillId);
  const start = new Date(p.startDate);
  const end = new Date(p.startDate);
  end.setDate(end.getDate() + p.probationDays);
  const fmt = (d: Date) => format.dateTime(d, { day: "numeric", month: "short" });

  // Messages about sample records never reach the real shop.
  const testNumber = process.env.DEMO_WHATSAPP_NUMBER?.replace(/\D/g, "") || null;
  const shopTarget = p.isDemo ? testNumber : p.enterprisePhone;
  const askToPay = paymentRequestMessage({
    workerName: p.workerName,
    enterpriseName: p.enterpriseName,
    skillMl: skill?.nameMl ?? "",
    amount: p.commissionAmount,
    trialDays: p.probationDays,
    contractorName: contractor.name,
  });
  const showRating = p.status === "confirmed" || p.status === "ended" || p.status === "failed";

  return (
    <div className="space-y-5">
      <PageHeader title={p.workerName} back={{ href: "/placements", label: t("placements.title") }} />
      {sp.new === "1" && <Notice tone="warn">{t("placements.savedUnpaid")}</Notice>}
      {sp.replaced === "1" && <Notice>{t("placements.replacedNotice")}</Notice>}

      {/* Money first: it decides what happens next. */}
      <section className="panel">
        <div className="flex items-center justify-between gap-3 bg-ink px-3 py-2.5 text-board">
          <span className="font-display text-lg">{t("placements.commissionLabel")}</span>
          <span className="font-display tabular text-2xl">₹{format.number(p.commissionAmount)}</span>
        </div>
        <div className="space-y-3 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPlate tone={COMMISSION_TONE[p.commissionStatus]}>{t(`placements.commission.${p.commissionStatus}`)}</StatusPlate>
            {p.commissionReceivedAt && p.commissionStatus !== "unpaid" && p.commissionStatus !== "lost" && (
              <span className="text-sm text-ink-2">{t("placements.paidOn", { date: fmt(p.commissionReceivedAt) })}</span>
            )}
          </div>
          <p className="text-[15px]">{t(`placements.explain.${p.commissionStatus}`, { date: fmt(end) })}</p>

          {p.status === "awaiting_payment" && (
            <>
              <div className="space-y-1">
                {shopTarget ? (
                  <a href={whatsappUrl(shopTarget, askToPay)} target="_blank" rel="noopener noreferrer" className="btn btn-wa w-full">
                    <MessageCircle className="size-5" aria-hidden />
                    {t("placements.askToPay")}
                  </a>
                ) : (
                  <span className="btn w-full border-dashed border-ink-2/50 bg-transparent text-ink-2" aria-disabled>
                    <MessageCircle className="size-5" aria-hidden />
                    {t("placements.askToPay")}
                  </span>
                )}
                {p.isDemo && !testNumber && <InfoButton variant="inline" />}
              </div>
              <ActionButton action={placementAction.bind(null, p.id, "paid")} className="btn btn-board min-h-14 w-full text-lg">
                <Truck className="size-5" aria-hidden />
                {t("placements.paidSend")}
              </ActionButton>
              <ActionButton action={placementAction.bind(null, p.id, "cancel")} confirm={t("placements.cancelConfirm")} className="btn btn-danger btn-sm w-full">
                <Ban className="size-4" aria-hidden />
                {t("placements.shopCancelled")}
              </ActionButton>
            </>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="strip">
          <span className="min-w-0 break-words">{localName(locale, skill)}</span>
          <StatusPlate tone={PLACEMENT_STATUS_TONE[p.status]}>{t(`placements.status.${p.status}`)}</StatusPlate>
        </div>
        <div className="space-y-4 p-4">
          <div className="flex items-center gap-3">
            <Avatar name={p.workerName} photoUrl={p.workerPhotoUrl} size={52} />
            <div className="min-w-0">
              <Link href={`/workers/${p.workerId}`} className="block text-base font-bold break-words">
                {p.workerName}
              </Link>
              <Link href={`/enterprises/${p.enterpriseId}`} className="block break-words text-ink-2">
                {p.enterpriseName}
              </Link>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-[15px]">
            <div>
              <dt className="text-ink-2">{p.status === "awaiting_payment" ? t("placements.plannedStart") : t("placements.startDate")}</dt>
              <dd className="font-semibold">{fmt(start)}</dd>
            </div>
            <div>
              <dt className="text-ink-2">{t("placements.trialEnds")}</dt>
              <dd className="font-semibold">{p.status === "awaiting_payment" ? t("placements.trialDays", { days: p.probationDays }) : fmt(end)}</dd>
            </div>
            <div>
              <dt className="text-ink-2">{t("placements.wage")}</dt>
              <dd className="tabular font-semibold">₹{format.number(p.wage)}</dd>
            </div>
          </dl>
          {p.replaces && (
            <Link href={`/placements/${p.replaces.id}`} className="block text-sm font-semibold text-ink-2 underline underline-offset-4">
              {t("placements.replaces", { name: p.replaces.workerName })}
            </Link>
          )}
          {p.replacedBy && (
            <Link href={`/placements/${p.replacedBy.id}`} className="block text-sm font-semibold text-ink-2 underline underline-offset-4">
              {t("placements.replacedBy", { name: p.replacedBy.workerName })}
            </Link>
          )}
        </div>
      </section>

      {p.status === "trial" && (
        <section className="space-y-2">
          <h2 className="font-display text-xl">{t("placements.howIsItGoing")}</h2>
          <div className="grid gap-2">
            <ActionButton action={placementAction.bind(null, p.id, "confirm")} className="btn btn-ink justify-start">
              <CircleCheck className="size-5" aria-hidden />
              {t("placements.confirm")}
            </ActionButton>
            <Link href={`/placements/${p.id}/replace`} className="btn btn-outline justify-start">
              <UserRoundPlus className="size-5" aria-hidden />
              {t("placements.sendReplacement")}
            </Link>
            <ActionButton action={placementAction.bind(null, p.id, "refund")} confirm={t("placements.refundConfirm")} className="btn btn-danger justify-start">
              <RotateCcw className="size-5" aria-hidden />
              {t("placements.refund")}
            </ActionButton>
          </div>
          <p className="text-sm text-ink-2">{t("placements.failHint")}</p>
        </section>
      )}

      {(p.status === "trial" || p.status === "confirmed") && (
        <ActionButton action={placementAction.bind(null, p.id, "end")} confirm={t("placements.endConfirm")} className="btn btn-outline w-full justify-start">
          <Flag className="size-5" aria-hidden />
          {t("placements.end")}
        </ActionButton>
      )}

      {p.commissionStatus === "earned" && (
        <p className="inline-flex items-center gap-2 text-[15px] font-semibold text-ok">
          <BadgeIndianRupee className="size-5" aria-hidden />
          {t("placements.earnedNote")}
        </p>
      )}

      {showRating && (
        <section className="panel">
          <div className="strip">
            <span className="min-w-0 break-words">{t("rating.title", { name: p.workerName })}</span>
          </div>
          <div className="p-4">
            <RatingPicker placementId={p.id} initial={p.rating ? { score: p.rating.score, note: p.rating.note } : undefined} />
          </div>
        </section>
      )}
    </div>
  );
}
