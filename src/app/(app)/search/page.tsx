import { Search } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { EnterpriseRow, NeedRow, WorkerRow } from "@/components/rows";
import { EmptyState, PageHeader, SearchBox, SectionTitle } from "@/components/ui";
import { requireContractor } from "@/lib/auth/session";
import { listEnterprises } from "@/lib/data/enterprises";
import { listNeeds } from "@/lib/data/needs";
import { listWorkers } from "@/lib/data/workers";

const LIMIT = 8;

export default async function SearchPage(props: PageProps<"/search">) {
  const contractor = await requireContractor();
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const t = await getTranslations();

  const [workers, needs, enterprises] = q
    ? await Promise.all([
        listWorkers(contractor.id, { q, limit: LIMIT }),
        listNeeds(contractor.id, { q, status: "open", limit: LIMIT }),
        listEnterprises(contractor.id, { q, limit: LIMIT }),
      ])
    : [[], [], []];
  const nothing = q && !workers.length && !needs.length && !enterprises.length;

  return (
    <div className="space-y-5">
      <PageHeader title={t("search.title")} back={{ href: "/", label: t("nav.home") }} />
      <SearchBox action="/search" q={q} placeholder={t("home.searchPlaceholder")} />
      {nothing && <EmptyState icon={<Search className="size-6" aria-hidden />} title={t("common.noResults")} />}
      {workers.length > 0 && (
        <section>
          <SectionTitle count={workers.length}>{t("workers.title")}</SectionTitle>
          <div className="space-y-2.5">
            {workers.map((w) => (
              <WorkerRow key={w.id} worker={w} />
            ))}
          </div>
        </section>
      )}
      {needs.length > 0 && (
        <section>
          <SectionTitle count={needs.length}>{t("needs.title")}</SectionTitle>
          <div className="space-y-3">
            {needs.map((n) => (
              <NeedRow key={n.id} need={n} />
            ))}
          </div>
        </section>
      )}
      {enterprises.length > 0 && (
        <section>
          <SectionTitle count={enterprises.length}>{t("enterprises.title")}</SectionTitle>
          <div className="space-y-2.5">
            {enterprises.map((e) => (
              <EnterpriseRow key={e.id} enterprise={e} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
