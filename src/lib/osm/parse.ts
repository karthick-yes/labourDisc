import { CATEGORIES } from "@/config/categories";
import {
  EXCLUDED_NAME_PATTERNS,
  EXCLUDED_TAGS,
  JUICE_NAME_PATTERN,
} from "@/config/osm-import";

export type OsmPlace = {
  osmId: string; // e.g. "way/305749443"
  name: string;
  lat: number;
  lng: number;
  tags: Record<string, string>;
};

export type ClassifiedPlace = OsmPlace & { categoryId: string; phone: string | null; areaName: string | null };

const hasTag = (tags: Record<string, string>, rule: string) => {
  const [key, value] = rule.split("=");
  return key in tags && (value === "*" || tags[key] === value);
};

/** Picks a category id for a named place, or null if it should be dropped. */
export function classify(name: string, tags: Record<string, string>): string | null {
  if (EXCLUDED_NAME_PATTERNS.some((re) => re.test(name))) return null;
  if (JUICE_NAME_PATTERN.test(name) || tags.cuisine === "juice") return "juice_shop";
  if (EXCLUDED_TAGS.some((rule) => hasTag(tags, rule))) return null;
  for (const c of CATEGORIES) {
    if (c.osmTags.some((rule) => hasTag(tags, rule))) return c.id;
  }
  return "shop" in tags ? "other" : null;
}

/** Overpass-turbo GeoJSON export -> places (points or way/relation centers). */
export function placesFromGeoJson(geojson: unknown): OsmPlace[] {
  const features = (geojson as { features?: unknown[] })?.features ?? [];
  const out: OsmPlace[] = [];
  for (const f of features as {
    id?: string;
    properties?: Record<string, string>;
    geometry?: { type: string; coordinates: number[] };
  }[]) {
    const tags = { ...(f.properties ?? {}) };
    const osmId = tags["@id"] ?? f.id;
    if (!osmId || f.geometry?.type !== "Point") continue;
    for (const k of Object.keys(tags)) if (k.startsWith("@")) delete tags[k];
    const [lng, lat] = f.geometry.coordinates;
    out.push({ osmId, name: (tags.name ?? "").trim(), lat, lng, tags });
  }
  return out;
}

/** Raw Overpass API JSON (`out center tags`) -> places. */
export function placesFromOverpass(json: unknown): OsmPlace[] {
  const elements = (json as { elements?: unknown[] })?.elements ?? [];
  const out: OsmPlace[] = [];
  for (const e of elements as {
    type: string;
    id: number;
    lat?: number;
    lon?: number;
    center?: { lat: number; lon: number };
    tags?: Record<string, string>;
  }[]) {
    const lat = e.lat ?? e.center?.lat;
    const lng = e.lon ?? e.center?.lon;
    if (lat == null || lng == null) continue;
    const tags = e.tags ?? {};
    out.push({ osmId: `${e.type}/${e.id}`, name: (tags.name ?? "").trim(), lat, lng, tags });
  }
  return out;
}

const normalizeName = (name: string) => name.toLowerCase().replace(/[^a-z0-9ഀ-ൿ]/g, "");

/**
 * Applies the filter rules, maps categories and removes duplicates (same
 * OSM id, or same name within ~100 m, which happens with building + shop).
 */
export function classifyPlaces(places: OsmPlace[]): ClassifiedPlace[] {
  const seenIds = new Set<string>();
  const seenNameCells = new Set<string>();
  const out: ClassifiedPlace[] = [];
  for (const p of places) {
    if (!p.name || seenIds.has(p.osmId)) continue;
    const categoryId = classify(p.name, p.tags);
    if (!categoryId) continue;
    const cell = `${normalizeName(p.name)}@${p.lat.toFixed(3)},${p.lng.toFixed(3)}`;
    if (seenNameCells.has(cell)) continue;
    seenIds.add(p.osmId);
    seenNameCells.add(cell);
    out.push({
      ...p,
      categoryId,
      phone: p.tags.phone ?? p.tags["contact:phone"] ?? p.tags.mobile ?? null,
      areaName: p.tags["addr:city"] ?? p.tags["addr:place"] ?? p.tags["addr:suburb"] ?? null,
    });
  }
  return out;
}
