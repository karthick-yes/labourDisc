import { Settings } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BottomNav } from "@/components/BottomNav";
import { InfoButton } from "@/components/InfoSheet";
import { LanguageToggle } from "@/components/LanguageToggle";
import { OfflineBanner } from "@/components/OfflineBanner";
import { requireContractor } from "@/lib/auth/session";
import { hasDemoData } from "@/lib/demo";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const contractor = await requireContractor();
  const [t, demo] = await Promise.all([getTranslations(), hasDemoData(contractor.id)]);
  const iconBtn = "flex size-10 items-center justify-center rounded-board border-2 border-white/70 text-white active:bg-white/15";

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 bg-bus text-white">
        <div className="mx-auto flex max-w-md items-center justify-between gap-2 px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-3">
          <Link href="/" className="min-w-0">
            <span className="font-display block truncate text-[1.45rem] leading-none">{contractor.name}</span>
            <span className="mt-0.5 block text-[13px] font-semibold text-white/85">PaniBook</span>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            {demo && <InfoButton />}
            <LanguageToggle onDark />
            <Link href="/settings" aria-label={t("nav.settings")} className={iconBtn}>
              <Settings className="size-5" aria-hidden />
            </Link>
          </div>
        </div>
      </header>
      <OfflineBanner />
      <main className="mx-auto w-full max-w-md flex-1 px-4 pt-4 pb-28">{children}</main>
      <BottomNav />
    </div>
  );
}
