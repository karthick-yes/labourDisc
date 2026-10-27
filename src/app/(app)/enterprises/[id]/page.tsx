import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { removeEnterprise } from "@/app/actions/enterprises";
import { ActionButton } from "@/components/ActionButton";
import { ContactButtons } from "@/components/ContactButtons";
import { NeedRow } from "@/components/rows";
import { EmptyState, PageHeader, SectionTitle } from "@/components/ui";
import { requireContractor } from "@/lib/auth/session";
import { getEnterprise } from "@/lib/data/enterprises";
import { listNeeds } from "@/lib/data/needs";
import { getReference } from "@/lib/data/reference";
import { maybeDistanceKm } from "@/lib/geo";
import { formatKm, localArea, localName } from "@/lib/names";
import { formatPhone } from "@/lib/phone";

export default async function EnterprisePage(props: PageProps<"/enterprises/[id]">) {
  const contractor = await requireContractor();
  const { id } = await props.params;
  const [t, locale, ref, enterprise, needs] = await Promise.all([
    getTranslations(),
    getLocale(),
    getReference(),
    getEnterprise(contractor.id, id),
    listNeeds(contractor.id, { enterpriseId: id }),
  ]);
  if (!enterprise) notFound();
  const km = maybeDistanceKm(enterprise, { lat: contractor.baseLat, lng: contractor.baseLng });
  const osmUrl = enterprise.source === "osm" && enterprise.sourceRef ? `https://www.openstreetmap.org/${enterprise.sourceRef}` : null;

  return (
    <div className="space-y-5">
      <PageHeader title={enterprise.name} back={{ href: "/enterprises", label: t("enterprises.title") }} />

      <section className="panel">
        <div className="strip text-base">
          <span className="min-w-0 break-words">
            {enterprise.categoryId ? localName(locale, ref.categoryById.get(enterprise.categoryId)) : t("enterprises.noCategory")}
          </span>
          {km != null && (
            <span className="tabular inline-flex shrink-0 items-center gap-1">
              <MapPin className="size-4" aria-hidden />
              {formatKm(km)}
            </span>
          )}
        </div>
        <div className="space-y-4 p-4">
          {(enterprise.areaName || enterprise.phone) && (
            <p className="text-[15px] text-ink-2">
              {localArea(locale, enterprise.areaName)}
              {enterprise.areaName && enterprise.phone && " · "}
              {enterprise.phone && <span className="tabular">{formatPhone(enterprise.phone)}</span>}
            </p>
          )}
          {enterprise.notes && <p className="text-[15px] whitespace-pre-line">{enterprise.notes}</p>}
          <ContactButtons phone={enterprise.phone} sample={false} />
          <div className="grid grid-cols-2 gap-2">
            <Link href={`/needs/new?enterprise=${enterprise.id}`} className="btn btn-primary">
              <Plus className="size-5" strokeWidth={3} aria-hidden />
              {t("needs.add")}
            </Link>
            <Link href={`/enterprises/${enterprise.id}/edit`} className="btn btn-outline">
              <Pencil className="size-5" aria-hidden />
              {t("common.edit")}
            </Link>
          </div>
          {osmUrl && (
            <p className="text-xs text-muted">
              {t("enterprises.osmSource")}{" "}
              <a href={osmUrl} target="_blank" rel="noopener noreferrer" className="underline">
                © OpenStreetMap contributors
              </a>
            </p>
          )}
        </div>
      </section>

      <section>
        <SectionTitle count={needs.length}>{t("needs.title")}</SectionTitle>
        {needs.length ? (
          <ul className="space-y-3">
            {needs.map((n) => (
              <li key={n.id}>
                <NeedRow need={n} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title={t("enterprises.noNeeds")} />
        )}
      </section>

      <ActionButton action={removeEnterprise.bind(null, enterprise.id)} confirm={t("enterprises.deleteConfirm")} className="btn btn-danger w-full">
        <Trash2 className="size-5" aria-hidden />
        {t("enterprises.delete")}
      </ActionButton>
    </div>
  );
}
