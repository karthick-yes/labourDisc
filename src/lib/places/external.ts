import { and, count, eq, gte, sql } from "drizzle-orm";
import { externalLimits, PLACE_CACHE_DAYS } from "@/config/limits";
import { db } from "@/db";
import { externalCalls, placeCache } from "@/db/schema";

// Every live call to a free public API goes through here: answers are cached
// in the DB, and calls are capped per contractor and app-wide per day.

export class ExternalLimitError extends Error {
  constructor(public service: "overpass" | "nominatim") {
    super(`Daily limit reached for ${service}`);
  }
}

const startOfToday = sql`date_trunc('day', now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata'`;

async function getCached<T>(key: string): Promise<T | null> {
  const [row] = await db
    .select({ payload: placeCache.payload })
    .from(placeCache)
    .where(and(eq(placeCache.key, key), gte(placeCache.createdAt, sql`now() - make_interval(days => ${PLACE_CACHE_DAYS})`)))
    .limit(1);
  return (row?.payload as T) ?? null;
}

async function underLimit(service: "overpass" | "nominatim", contractorId: string | null) {
  const limits = externalLimits();
  const [perDay, perContractor] =
    service === "overpass"
      ? [limits.overpassPerDay, limits.overpassPerContractorPerDay]
      : [limits.nominatimPerDay, limits.nominatimPerContractorPerDay];
  const [all] = await db
    .select({ n: count() })
    .from(externalCalls)
    .where(and(eq(externalCalls.service, service), gte(externalCalls.createdAt, startOfToday)));
  if (all.n >= perDay) return false;
  if (contractorId) {
    const [mine] = await db
      .select({ n: count() })
      .from(externalCalls)
      .where(
        and(eq(externalCalls.service, service), eq(externalCalls.contractorId, contractorId), gte(externalCalls.createdAt, startOfToday)),
      );
    if (mine.n >= perContractor) return false;
  }
  return true;
}

/** Cached result for `key`, or one rate-limited live call. */
export async function cachedExternal<T>(opts: {
  key: string;
  service: "overpass" | "nominatim";
  contractorId: string | null;
  fetch: () => Promise<T>;
}): Promise<{ data: T; cached: boolean }> {
  const hit = await getCached<T>(opts.key);
  if (hit) return { data: hit, cached: true };
  if (!(await underLimit(opts.service, opts.contractorId))) throw new ExternalLimitError(opts.service);
  await db.insert(externalCalls).values({ service: opts.service, contractorId: opts.contractorId });
  const data = await opts.fetch();
  await db
    .insert(placeCache)
    .values({ key: opts.key, payload: data as object })
    .onConflictDoUpdate({ target: placeCache.key, set: { payload: data as object, createdAt: new Date() } });
  return { data, cached: false };
}

// Nominatim's usage policy: max 1 request per second, identify the app.
let lastNominatim = 0;
const USER_AGENT = "PaniBook/0.1 (labour contractor app; low volume)";

export type Geocoded = { name: string; lat: number; lng: number };

/** Place name -> coordinates (India only), cached and rate limited. */
export async function geocodePlace(query: string, contractorId: string): Promise<Geocoded[]> {
  const q = query.trim().toLowerCase().replace(/\s+/g, " ");
  const { data } = await cachedExternal<Geocoded[]>({
    key: `nominatim:${q}`,
    service: "nominatim",
    contractorId,
    fetch: async () => {
      const wait = lastNominatim + 1100 - Date.now();
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      lastNominatim = Date.now();
      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.search = new URLSearchParams({ q, format: "jsonv2", countrycodes: "in", limit: "5", "accept-language": "en" }).toString();
      const res = await fetch(url, { headers: { "User-Agent": USER_AGENT }, signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error(`Nominatim returned ${res.status}`);
      const rows = (await res.json()) as { display_name: string; lat: string; lon: string }[];
      return rows.map((r) => ({ name: r.display_name.split(",").slice(0, 3).join(","), lat: Number(r.lat), lng: Number(r.lon) }));
    },
  });
  return data;
}
