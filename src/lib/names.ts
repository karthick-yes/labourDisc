import { REGIONS } from "@/config/regions";

// Display names for seed-table rows in the current UI language.

type Named = { nameMl: string } & ({ canonicalNameEn: string } | { nameEn: string });

export function localName(locale: string, row: Named | undefined | null): string {
  if (!row) return "—";
  if (locale === "ml") return row.nameMl;
  return "canonicalNameEn" in row ? row.canonicalNameEn : row.nameEn;
}

export function formatKm(km: number | null): string | null {
  if (km == null) return null;
  return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

/** Known town names in the UI language (e.g. "Perumbavoor" -> "പെരുമ്പാവൂർ"). */
export function localArea(locale: string, area: string | null | undefined): string | null {
  if (!area) return null;
  if (locale !== "ml") return area;
  const r = REGIONS.find((x) => x.en.toLowerCase() === area.trim().toLowerCase());
  return r ? r.ml : area;
}
