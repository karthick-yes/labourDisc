import type { Metadata } from "next";
import { MessageCircle, Phone, Star } from "lucide-react";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Avatar } from "@/components/ui";
import { getReference } from "@/lib/data/reference";
import { getPublicWorker } from "@/lib/data/workers";
import { localName } from "@/lib/names";
import { formatPhone } from "@/lib/phone";
import { whatsappUrl } from "@/lib/share";

// Public worker profile for employers (brief §3 Flow D). The contractor is
// the contact, front and centre. Never the worker's phone, address or ID.

export const metadata: Metadata = {
  title: "PaniBook",
  robots: { index: false, follow: false, nocache: true },
};

export default async function PublicWorkerPage(props: PageProps<"/w/[token]">) {
  const { token } = await props.params;
  const worker = await getPublicWorker(token);
  if (!worker) notFound();
  const [t, locale, ref] = await Promise.all([getTranslations(), getLocale(), getReference()]);

  return (
    <div className="min-h-dvh">
      {/* The contractor's own masthead: this page is his agency's card. */}
      <header className="bg-bus text-white">
        <div className="mx-auto max-w-md px-5 pt-6 pb-5">
          <p className="font-display text-[1.75rem] leading-tight">{worker.contractorName}</p>
          <p className="tabular font-semibold text-white/90">{formatPhone(worker.contractorPhone)}</p>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-5 px-4 py-5">
        <section className="panel">
          <div className="flex items-center gap-4 p-4">
            <Avatar name={worker.name} photoUrl={worker.photoUrl} size={96} />
            <div className="min-w-0">
              <h1 className="font-display text-[1.75rem] leading-tight">{worker.name}</h1>
              {worker.homeState && <p className="text-ink-2">{worker.homeState}</p>}
              {worker.rating.count > 0 && worker.rating.avg != null ? (
                <p className="mt-1 inline-flex items-center gap-1 font-semibold">
                  <Star className="size-5 fill-board-dark text-board-dark" aria-hidden />
                  <span className="tabular">{worker.rating.avg.toFixed(1)}</span>
                  <span className="font-normal text-ink-2">· {t("public.ratedBy", { count: worker.rating.count })}</span>
                </p>
              ) : (
                <p className="mt-1 text-sm text-ink-2">{t("public.newWorker")}</p>
              )}
            </div>
          </div>
          {worker.availability !== "available" && (
            <p className="border-t-2 border-ground px-4 py-2 font-semibold text-ink-2">{t("public.notAvailable")}</p>
          )}
        </section>

        <section className="panel">
          <h2 className="strip">{t("public.skills")}</h2>
          <ul className="divide-y-2 divide-ground">
            {worker.skills.map((s) => (
              <li key={s.skillId} className="flex items-center justify-between px-4 py-3">
                <span className="text-base font-bold">{localName(locale, ref.skillById.get(s.skillId))}</span>
                {s.years ? <span className="tabular font-semibold text-ink-2">{t("public.years", { years: s.years })}</span> : null}
              </li>
            ))}
          </ul>
        </section>

        {worker.videoUrl && (
          <section className="panel">
            <h2 className="strip">{t("public.video")}</h2>
            <video src={worker.videoUrl} controls playsInline preload="metadata" className="aspect-video w-full bg-ink" />
          </section>
        )}

        <dl className="grid grid-cols-2 overflow-hidden rounded-board border-2 border-ink bg-ink [gap:2px]">
          {worker.expectedWage && (
            <div className="bg-board p-3.5">
              <dt className="text-sm font-semibold text-ink-2">{t("public.expectedWage")}</dt>
              <dd className="font-display tabular text-2xl">
                ₹{worker.expectedWage}
                <span className="text-base text-ink-2">/{t("common.day")}</span>
              </dd>
            </div>
          )}
          {worker.languages.length > 0 && (
            <div className={`bg-surface p-3.5 ${worker.expectedWage ? "" : "col-span-2"}`}>
              <dt className="text-sm font-semibold text-ink-2">{t("public.languages")}</dt>
              <dd className="font-semibold">{worker.languages.join(", ")}</dd>
            </div>
          )}
        </dl>

        <section className="space-y-2">
          <p className="font-semibold">{t("public.contact", { name: worker.contractorName })}</p>
          <div className="flex gap-2">
            <a href={`tel:+${worker.contractorPhone}`} className="btn btn-outline min-h-14 flex-1 text-lg">
              <Phone className="size-5" aria-hidden />
              {t("contact.call")}
            </a>
            <a
              href={whatsappUrl(worker.contractorPhone, t("public.waMessage", { name: worker.name }))}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-wa min-h-14 flex-[1.4] text-lg"
            >
              <MessageCircle className="size-5" aria-hidden />
              {t("contact.whatsapp")}
            </a>
          </div>
        </section>
      </main>
      <footer className="px-4 pb-8 text-center text-xs text-muted">{t("public.footer")}</footer>
    </div>
  );
}
