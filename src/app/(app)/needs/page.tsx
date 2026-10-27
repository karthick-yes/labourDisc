import { ClipboardList, Plus } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { NeedRow } from "@/components/rows";
import { EmptyState, FilterChips, PageHeader, SearchBox } from "@/components/ui";
import { requireContractor } from "@/lib/auth/session";
import { listNeeds, type NeedStatus } from "@/lib/data/needs";
import { maybeDistanceKm } from "@/lib/geo";

const FILTERS = ["open", "filled", "cancelled"] as const;

export default async function NeedsPage(props: PageProps<"/needs">) {
  const contractor = await requireContractor();
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  // Open needs by default; "all" shows everything.
  const status: NeedStatus | undefined = sp.status === "all" ? undefined : (FILTERS.find((f) => f === sp.status) ?? "open");
  const [t, needs] = await Promise.all([getTranslations(), listNeeds(contractor.id, { status, q })]);

  const href = (s: string) => {
    const p = new URLSearchParams({ status: s });
    if (q) p.set("q", q);
    return `/needs?${p}`;
  };
  const base = { lat: contractor.baseLat, lng: contractor.baseLng };

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("needs.title")}
        action={
          <Link href="/needs/new" className="btn btn-primary btn-sm">
            <Plus className="size-4" strokeWidth={3} aria-hidden />
            {t("needs.add")}
          </Link>
        }
      />
      <SearchBox action="/needs" q={q} placeholder={t("needs.searchPlaceholder")} hidden={{ status: status ?? "all" }} />
      <FilterChips
        items={[
          ...FILTERS.map((f) => ({ href: href(f), label: t(`needs.status.${f}`), active: status === f })),
          { href: href("all"), label: t("common.all"), active: !status },
        ]}
      />
      {needs.length ? (
        <ul className="space-y-3">
          {needs.map((n) => (
            <li key={n.id}>
              <NeedRow need={n} distanceKm={maybeDistanceKm({ lat: n.enterpriseLat, lng: n.enterpriseLng }, base)} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={<ClipboardList className="size-6" aria-hidden />}
          title={q ? t("common.noResults") : t("needs.empty")}
          action={
            !q && (
              <Link href="/needs/new" className="btn btn-primary">
                {t("home.newNeed")}
              </Link>
            )
          }
        />
      )}
    </div>
  );
}
