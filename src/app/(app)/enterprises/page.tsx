import { Map, Plus, Search, Store } from "lucide-react";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { EnterpriseRow } from "@/components/rows";
import { EmptyState, FilterChips, PageHeader, SearchBox } from "@/components/ui";
import { requireContractor } from "@/lib/auth/session";
import { listEnterprises } from "@/lib/data/enterprises";
import { getCategories } from "@/lib/data/reference";
import { maybeDistanceKm } from "@/lib/geo";
import { localName } from "@/lib/names";

export default async function EnterprisesPage(props: PageProps<"/enterprises">) {
  const contractor = await requireContractor();
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const [t, locale, categories] = await Promise.all([getTranslations(), getLocale(), getCategories()]);
  const category = categories.find((c) => c.id === sp.category)?.id;
  const hiring = sp.hiring === "1";
  const list = await listEnterprises(contractor.id, { q, categoryId: category, withOpenNeeds: hiring });

  const href = (opts: { category?: string; hiring?: boolean }) => {
    const p = new URLSearchParams();
    if (opts.category) p.set("category", opts.category);
    if (opts.hiring) p.set("hiring", "1");
    if (q) p.set("q", q);
    return `/enterprises${p.size ? `?${p}` : ""}`;
  };
  const base = { lat: contractor.baseLat, lng: contractor.baseLng };
  // Hiring shops first, then nearest.
  const rows = list
    .map((e) => ({ e, km: maybeDistanceKm(e, base) }))
    .sort((a, b) => Number(b.e.openNeeds > 0) - Number(a.e.openNeeds > 0) || (a.km ?? 1e9) - (b.km ?? 1e9));

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("enterprises.title")}
        action={
          <Link href="/enterprises/new" className="btn btn-board btn-sm">
            <Plus className="size-4" strokeWidth={3} aria-hidden />
            {t("enterprises.addShort")}
          </Link>
        }
      />
      <div className="grid grid-cols-2 gap-2">
        <Link href="/enterprises/find" className="btn btn-ink">
          <Search className="size-5" aria-hidden />
          {t("find.cta")}
        </Link>
        <Link href="/map" className="btn btn-outline">
          <Map className="size-5" aria-hidden />
          {t("map.title")}
        </Link>
      </div>
      <SearchBox
        action="/enterprises"
        q={q}
        placeholder={t("enterprises.searchPlaceholder")}
        hidden={{ ...(category ? { category } : {}), ...(hiring ? { hiring: "1" } : {}) }}
      />
      <FilterChips
        items={[
          { href: href({}), label: t("common.all"), active: !category && !hiring },
          { href: href({ hiring: true }), label: t("enterprises.hiring"), active: hiring && !category },
          ...categories
            .filter((c) => c.id !== "other")
            .map((c) => ({ href: href({ category: c.id }), label: localName(locale, c), active: category === c.id })),
        ]}
      />
      {rows.length ? (
        <ul className="space-y-2.5">
          {rows.map(({ e, km }) => (
            <li key={e.id}>
              <EnterpriseRow enterprise={e} distanceKm={km} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={<Store className="size-6" aria-hidden />}
          title={q ? t("common.noResults") : t("enterprises.empty")}
          body={q ? undefined : t("enterprises.emptyHint")}
          action={
            !q && (
              <Link href="/enterprises/find" className="btn btn-ink">
                {t("find.cta")}
              </Link>
            )
          }
        />
      )}
    </div>
  );
}
