import { getTranslations } from "next-intl/server";
import { LanguageToggle } from "@/components/LanguageToggle";

export default async function AuthLayout({ children }: LayoutProps<"/">) {
  const t = await getTranslations("app");
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="bg-bus text-white">
        <div className="mx-auto max-w-md px-4 pt-[max(env(safe-area-inset-top),1.25rem)] pb-5">
          <div className="flex items-start justify-between gap-3">
            <p className="font-display text-[2rem] leading-none">{t("name")}</p>
            <LanguageToggle onDark />
          </div>
          <p className="mt-3 rounded-board bg-ink px-3 py-2 font-display text-lg text-board">{t("tagline")}</p>
        </div>
      </header>
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
