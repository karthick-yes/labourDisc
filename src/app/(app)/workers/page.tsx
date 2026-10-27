import { Plus, Users } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { WorkerRow } from "@/components/rows";
import { EmptyState, FilterChips, PageHeader, SearchBox } from "@/components/ui";
import { requireContractor } from "@/lib/auth/session";
import { listWorkers, type Availability } from "@/lib/data/workers";

const FILTERS = ["available", "placed", "inactive"] as const;

export default async function WorkersPage(props: PageProps<"/workers">) {
  const contractor = await requireContractor();
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const status = FILTERS.find((f) => f === sp.status) as Availability | undefined;
  const [t, workers] = await Promise.all([getTranslations(), listWorkers(contractor.id, { availability: status, q })]);

  const href = (s?: string) => {
    const p = new URLSearchParams();
    if (s) p.set("status", s);
    if (q) p.set("q", q);
    return `/workers${p.size ? `?${p}` : ""}`;
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("workers.title")}
        action={
          <Link href="/workers/new" className="btn btn-board btn-sm">
            <Plus className="size-4" strokeWidth={3} aria-hidden />
            {t("workers.add")}
          </Link>
        }
      />
      <SearchBox action="/workers" q={q} placeholder={t("workers.searchPlaceholder")} hidden={status ? { status } : undefined} />
      <FilterChips
        items={[
          { href: href(), label: t("common.all"), active: !status },
          ...FILTERS.map((f) => ({ href: href(f), label: t(`workers.availability.${f}`), active: status === f })),
        ]}
      />
      {workers.length ? (
        <ul className="space-y-2.5">
          {workers.map((w) => (
            <li key={w.id}>
              <WorkerRow worker={w} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={<Users className="size-6" aria-hidden />}
          title={q ? t("common.noResults") : t("workers.empty")}
          action={
            !q && (
              <Link href="/workers/new" className="btn btn-board">
                {t("home.newWorker")}
              </Link>
            )
          }
        />
      )}
    </div>
  );
}
