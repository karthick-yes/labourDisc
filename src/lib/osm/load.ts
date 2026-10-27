import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import {
  DEMO_RADIUS_KM,
  MIN_PLACES_BEFORE_LIVE_FETCH,
  OSM_DATA_DIR,
  OVERPASS_TIMEOUT_S,
  OVERPASS_URL,
} from "@/config/osm-import";
import { distanceKm, type LatLng } from "@/lib/geo";
import { cachedExternal } from "@/lib/places/external";
import { classifyPlaces, placesFromGeoJson, placesFromOverpass, type OsmPlace } from "./parse";

type Bundle = { places: OsmPlace[]; box: { minLat: number; maxLat: number; minLng: number; maxLng: number } };
let bundledCache: Promise<Bundle[]> | null = null;

/** Bundled overpass-turbo exports in data/osm/ (read once), with their extents. */
function bundles(): Promise<Bundle[]> {
  bundledCache ??= (async () => {
    const dir = path.join(/*turbopackIgnore: true*/ process.cwd(), OSM_DATA_DIR);
    const files = (await readdir(dir).catch(() => [])).filter((f) => /\.(geo)?json$/.test(f));
    return Promise.all(
      files.map(async (f) => {
        const places = placesFromGeoJson(JSON.parse(await readFile(path.join(dir, f), "utf8")));
        const lats = places.map((p) => p.lat);
        const lngs = places.map((p) => p.lng);
        return {
          places,
          box: { minLat: Math.min(...lats), maxLat: Math.max(...lats), minLng: Math.min(...lngs), maxLng: Math.max(...lngs) },
        };
      }),
    );
  })();
  return bundledCache;
}

const covers = (b: Bundle, c: LatLng) =>
  c.lat >= b.box.minLat && c.lat <= b.box.maxLat && c.lng >= b.box.minLng && c.lng <= b.box.maxLng;

/** Raw live query to the public Overpass API. */
export async function fetchOverpassPlaces(center: LatLng, radiusKm: number): Promise<OsmPlace[]> {
  const around = `around:${Math.round(radiusKm * 1000)},${center.lat},${center.lng}`;
  const query = `[out:json][timeout:${OVERPASS_TIMEOUT_S}];
(
  nwr(${around})[shop][name];
  nwr(${around})[amenity~"^(restaurant|cafe|fast_food)$"][name];
  nwr(${around})[craft][name];
  nwr(${around})[man_made=works][name];
  nwr(${around})[industrial][name];
);
out center tags;`;
  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "PaniBook/0.1 (labour contractor app; low volume)" },
    body: new URLSearchParams({ data: query }),
    signal: AbortSignal.timeout((OVERPASS_TIMEOUT_S + 10) * 1000),
  });
  if (!res.ok) throw new Error(`Overpass returned ${res.status}`);
  return placesFromOverpass(await res.json());
}

/**
 * Filtered, categorised places near a point: bundled files first; only when
 * no bundled file covers the point (or it has very few places nearby), one
 * cached, rate-limited live Overpass query.
 */
export async function placesNear(center: LatLng, radiusKm = DEMO_RADIUS_KM, contractorId: string | null = null) {
  const near = (list: OsmPlace[]) => list.filter((p) => distanceKm(center, p) <= radiusKm);
  const all = await bundles();
  let places = classifyPlaces(near(all.flatMap((b) => b.places)));
  const covered = all.some((b) => covers(b, center));
  let source: "bundled" | "live" | "cache" | "bundled+live" = "bundled";
  let liveError: string | null = null;
  if (!covered || places.length < MIN_PLACES_BEFORE_LIVE_FETCH) {
    try {
      // Round the centre (~1 km) so nearby searches share one cached answer.
      const key = `overpass:${center.lat.toFixed(2)},${center.lng.toFixed(2)}:${radiusKm}`;
      const { data, cached } = await cachedExternal({
        key,
        service: "overpass",
        contractorId,
        fetch: () => fetchOverpassPlaces({ lat: Number(center.lat.toFixed(2)), lng: Number(center.lng.toFixed(2)) }, radiusKm),
      });
      const merged = classifyPlaces([...places, ...near(data)]);
      source = cached ? "cache" : places.length ? "bundled+live" : "live";
      places = merged;
    } catch (err) {
      liveError = err instanceof Error ? err.message : String(err);
    }
  }
  return { places, source, liveError };
}
