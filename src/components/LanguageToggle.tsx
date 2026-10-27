"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLocale } from "@/app/actions/settings";

export function LanguageToggle({ onDark }: { onDark?: boolean }) {
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const next = locale === "ml" ? "en" : "ml";

  return (
    <button
      type="button"
      disabled={pending}
      lang={next}
      onClick={() =>
        startTransition(async () => {
          await setLocale(next);
          router.refresh();
        })
      }
      className={`min-h-10 rounded-board border-2 px-3 text-sm font-bold disabled:opacity-60 ${
        onDark ? "border-white/70 text-white active:bg-white/15" : "border-ink bg-surface text-ink"
      }`}
    >
      {next === "en" ? "English" : "മലയാളം"}
    </button>
  );
}
