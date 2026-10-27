import { Download, LogOut } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { logout } from "@/app/actions/auth";
import { DemoControls } from "@/components/DemoControls";
import { InstallApp } from "@/components/InstallApp";
import { PageHeader } from "@/components/ui";
import { requireContractor } from "@/lib/auth/session";
import { hasDemoData } from "@/lib/demo";
import { formatPhone } from "@/lib/phone";
import { DeleteAccount } from "./DeleteAccount";
import { SettingsForm } from "./SettingsForm";

const EXPORTS = ["workers", "enterprises", "needs", "placements"] as const;

export default async function SettingsPage() {
  const contractor = await requireContractor();
  const [t, hasDemo] = await Promise.all([getTranslations(), hasDemoData(contractor.id)]);

  return (
    <div className="space-y-6">
      <PageHeader title={t("settings.title")} back={{ href: "/", label: t("nav.home") }} />

      <section className="panel">
        <div className="strip text-base">{t("settings.account")}</div>
        <div className="p-4">
          <p className="font-display text-xl">{contractor.name}</p>
          <p className="tabular text-ink-2">{formatPhone(contractor.phone)}</p>
        </div>
      </section>

      <InstallApp />

      <SettingsForm
        initial={{
          probationDays: contractor.defaultProbationDays,
          lat: contractor.baseLat,
          lng: contractor.baseLng,
          areaName: contractor.areaName ?? "",
        }}
      />

      <section className="panel">
        <div className="strip text-base">{t("settings.demo.title")}</div>
        <div className="space-y-3 p-4">
          <p className="text-[15px] text-ink-2">{t("settings.demo.hint")}</p>
          <DemoControls hasDemo={hasDemo} />
        </div>
      </section>

      <section className="panel">
        <div className="strip text-base">{t("settings.data.title")}</div>
        <div className="space-y-3 p-4">
          <p className="text-[15px] text-ink-2">{t("settings.data.exportHint")}</p>
          <div className="grid grid-cols-2 gap-2">
            {EXPORTS.map((e) => (
              <a key={e} href={`/api/export?type=${e}`} className="btn btn-outline btn-sm" download>
                <Download className="size-4" aria-hidden />
                {t(`settings.data.${e}`)}
              </a>
            ))}
          </div>
          <DeleteAccount />
        </div>
      </section>

      <form action={logout}>
        <button type="submit" className="btn btn-outline w-full">
          <LogOut className="size-5" aria-hidden />
          {t("auth.logout")}
        </button>
      </form>
    </div>
  );
}
