import { MapPin } from "lucide-react";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { EmptyState, PageHeader } from "@/components/ui";
import { requireContractor } from "@/lib/auth/session";
import { listEnterprises } from "@/lib/data/enterprises";
import { getReference } from "@/lib/data/reference";
import { maybeDistanceKm } from "@/lib/geo";
import { localName } from "@/lib/names";
import { MapLoader } from "./MapLoader";

const MAP_RADIUS_KM = 30;

export default async function MapPage() {
  const contractor = await requireContractor();
  const [t, locale, ref] = await Promise.all([getTranslations(), getLocale(), getReference()]);
  if (contractor.baseLat == null || contractor.baseLng == null) {
    return (
      <>
        <PageHeader title={t("map.title")} back={{ href: "/enterprises", label: t("enterprises.title") }} />
        <EmptyState
          icon={<MapPin className="size-6" aria-hidden />}
          title={t("home.noLocation")}
          action={
            <Link href="/settings" className="btn btn-ink">
              {t("nav.settings")}
            </Link>
          }
        />
      </>
    );
  }

  const base = { lat: contractor.baseLat, lng: contractor.baseLng };
  const shops = (await listEnterprises(contractor.id, { limit: 5000 }))
    .filter((e) => e.lat != null && e.lng != null && (maybeDistanceKm(e, base) ?? Infinity) <= MAP_RADIUS_KM)
    .map((e) => ({
      id: e.id,
      name: e.name,
      lat: e.lat!,
      lng: e.lng!,
      openNeeds: e.openNeeds,
      category: localName(locale, e.categoryId ? ref.categoryById.get(e.categoryId) : null),
    }));

  return (
    <>
      <PageHeader title={t("map.title")} back={{ href: "/enterprises", label: t("enterprises.title") }} />
      <MapLoader base={base} shops={shops} />
    </>
  );
}
