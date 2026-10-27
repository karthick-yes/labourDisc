"use client";

import { Info, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";

/**
 * The only in-app mention of sample data: an (i) button that opens a sheet
 * explaining what is sample and what is real. No per-record badges.
 */
export function InfoButton({ variant = "header" }: { variant?: "header" | "inline" }) {
  const t = useTranslations("demoInfo");
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        aria-label={variant === "header" ? t("open") : undefined}
        className={
          variant === "header"
            ? "flex size-10 items-center justify-center rounded-board border-2 border-white/70 text-white active:bg-white/15"
            : "inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold text-ink-2 underline underline-offset-4"
        }
      >
        <Info className="size-5" aria-hidden />
        {variant === "inline" && t("whyOff")}
      </button>
      <dialog
        ref={ref}
        className="m-0 mt-auto w-full max-w-none bg-transparent p-0 backdrop:bg-ink/60 open:flex open:justify-center"
        onClick={(e) => e.target === ref.current && ref.current?.close()}
      >
        <div className="w-full max-w-md rounded-t-2xl border-2 border-b-0 border-ink bg-surface pb-[env(safe-area-inset-bottom)]">
          <div className="strip rounded-t-[14px]">
            {t("title")}
            <button type="button" onClick={() => ref.current?.close()} aria-label={t("close")} className="flex size-9 items-center justify-center">
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <div className="space-y-3 p-4 text-[15px] leading-relaxed">
            <p>{t("sample")}</p>
            <p>{t("real")}</p>
            <p>{t("safety")}</p>
            <p className="text-muted">{t("clear")}</p>
            <button type="button" className="btn btn-ink w-full" onClick={() => ref.current?.close()}>
              {t("ok")}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
