"use client";

import { Eraser, LoaderCircle, RefreshCw, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { clearDemo, loadDemo, type DemoState } from "@/app/actions/demo";

/** Load / clear sample data. `compact` is the home-screen call to action. */
export function DemoControls({ hasDemo, compact }: { hasDemo: boolean; compact?: boolean }) {
  const t = useTranslations("settings.demo");
  const router = useRouter();
  const [state, setState] = useState<DemoState>({});
  const [pending, startTransition] = useTransition();

  const run = (fn: () => Promise<DemoState>, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    startTransition(async () => {
      setState(await fn());
      router.refresh();
    });
  };

  return (
    <div className="space-y-2.5">
      <button
        type="button"
        className={`btn w-full ${compact ? "btn-primary" : "btn-outline"}`}
        disabled={pending}
        aria-busy={pending}
        onClick={() => run(loadDemo, hasDemo ? t("reloadConfirm") : undefined)}
      >
        {pending ? (
          <LoaderCircle className="size-5 animate-spin" aria-hidden />
        ) : hasDemo ? (
          <RefreshCw className="size-5" aria-hidden />
        ) : (
          <Sparkles className="size-5" aria-hidden />
        )}
        {pending ? t("loading") : hasDemo ? t("reload") : t("load")}
      </button>
      {hasDemo && !compact && (
        <button type="button" className="btn btn-danger w-full" disabled={pending} onClick={() => run(clearDemo, t("clearConfirm"))}>
          <Eraser className="size-5" aria-hidden />
          {t("clear")}
        </button>
      )}
      {state.ok === "loaded" && state.counts && <p className="font-semibold text-ok">{t("loaded", state.counts)}</p>}
      {state.ok === "cleared" && <p className="font-semibold text-ok">{t("cleared")}</p>}
      {state.error && (
        <p role="alert" className="font-semibold text-danger">
          {t(`errors.${state.error}`)}
        </p>
      )}
    </div>
  );
}
