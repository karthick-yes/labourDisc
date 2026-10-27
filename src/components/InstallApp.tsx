"use client";

import { Download, Share, SquarePlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, useSyncExternalStore } from "react";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const noop = () => () => {};
const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;
// iPadOS reports itself as a Mac; touch support tells them apart.
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.userAgent.includes("Mac") && navigator.maxTouchPoints > 1);

/**
 * "Add to home screen" help. Android/Chrome gets a real install button
 * (beforeinstallprompt); iPhone Safari has no such event, so it gets the
 * Share → Add to Home Screen steps. Hidden once installed.
 */
export function InstallApp() {
  const t = useTranslations("install");
  const standalone = useSyncExternalStore(noop, isStandalone, () => true);
  const ios = useSyncExternalStore(noop, isIos, () => false);
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (standalone || (!ios && !prompt)) return null;

  return (
    <section className="panel">
      <div className="strip text-base">{t("title")}</div>
      <div className="space-y-3 p-4 text-[15px]">
        <p className="text-ink-2">{t("why")}</p>
        {prompt ? (
          <button
            type="button"
            className="btn btn-ink w-full"
            onClick={async () => {
              await prompt.prompt();
              setPrompt(null);
            }}
          >
            <Download className="size-5" aria-hidden />
            {t("install")}
          </button>
        ) : (
          <ol className="space-y-2">
            <li className="flex items-center gap-2">
              <span className="tabular flex size-7 shrink-0 items-center justify-center rounded-md bg-ink text-sm font-bold text-board">1</span>
              {t("iosStep1")}
              <Share className="size-5 shrink-0" aria-label={t("shareIcon")} />
            </li>
            <li className="flex items-center gap-2">
              <span className="tabular flex size-7 shrink-0 items-center justify-center rounded-md bg-ink text-sm font-bold text-board">2</span>
              {t("iosStep2")}
              <SquarePlus className="size-5 shrink-0" aria-hidden />
            </li>
            <li className="flex items-center gap-2">
              <span className="tabular flex size-7 shrink-0 items-center justify-center rounded-md bg-ink text-sm font-bold text-board">3</span>
              {t("iosStep3")}
            </li>
          </ol>
        )}
      </div>
    </section>
  );
}
