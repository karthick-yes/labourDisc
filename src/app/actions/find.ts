"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { CATEGORIES } from "@/config/categories";
import { db } from "@/db";
import { enterprises } from "@/db/schema";
import { requireContractor } from "@/lib/auth/session";
import { distanceKm } from "@/lib/geo";
import { placesNear } from "@/lib/osm/load";
import { normalizePhone } from "@/lib/phone";
import { ExternalLimitError, geocodePlace, type Geocoded } from "@/lib/places/external";

// "Find businesses": look up real shops around any place (OpenStreetMap) and
// add the ones the contractor wants to his book.

export type FoundPlace = {
  osmId: string;
  name: string;
  categoryId: string;
  lat: number;
  lng: number;
  km: number;
  phone: string | null;
  areaName: string | null;
  added: boolean;
};

export type FindResult = { ok: true; places: FoundPlace[]; live: boolean } | { ok: false; error: "limit" | "failed" };

export async function geocode(query: string): Promise<{ ok: true; results: Geocoded[] } | { ok: false; error: "limit" | "failed" }> {
  const contractor = await requireContractor();
  const q = z.string().trim().min(2).max(100).safeParse(query);
  if (!q.success) return { ok: true, results: [] };
  try {
    return { ok: true, results: await geocodePlace(q.data, contractor.id) };
  } catch (err) {
    return { ok: false, error: err instanceof ExternalLimitError ? "limit" : "failed" };
  }
}

const searchSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  radiusKm: z.union([z.literal(2), z.literal(5), z.literal(10), z.literal(20)]),
});

export async function searchBusinesses(input: z.infer<typeof searchSchema>): Promise<FindResult> {
  const contractor = await requireContractor();
  const { lat, lng, radiusKm } = searchSchema.parse(input);
  const { places, source, liveError } = await placesNear({ lat, lng }, radiusKm, contractor.id);
  if (!places.length && liveError) return { ok: false, error: liveError.includes("limit") ? "limit" : "failed" };

  const existing = places.length
    ? await db
        .select({ ref: enterprises.sourceRef })
        .from(enterprises)
        .where(and(eq(enterprises.contractorId, contractor.id), eq(enterprises.source, "osm"), inArray(enterprises.sourceRef, places.map((p) => p.osmId))))
    : [];
  const added = new Set(existing.map((e) => e.ref));
  return {
    ok: true,
    live: source !== "bundled",
    places: places
      .map((p) => ({
        osmId: p.osmId,
        name: p.name,
        categoryId: p.categoryId,
        lat: p.lat,
        lng: p.lng,
        km: Math.round(distanceKm({ lat, lng }, p) * 10) / 10,
        phone: p.phone ? normalizePhone(p.phone) : null,
        areaName: p.areaName,
        added: added.has(p.osmId),
      }))
      .sort((a, b) => a.km - b.km)
      .slice(0, 300),
  };
}

const placeSchema = z.object({
  osmId: z.string().regex(/^(node|way|relation)\/\d+$/),
  name: z.string().trim().min(1).max(120),
  categoryId: z.enum(CATEGORIES.map((c) => c.id) as [string, ...string[]]),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  phone: z.string().regex(/^\d{12}$/).nullable(),
  areaName: z.string().max(80).nullable(),
});

export async function addBusinesses(input: unknown[]): Promise<{ added: number }> {
  const contractor = await requireContractor();
  const places = z.array(placeSchema).max(300).parse(input);
  if (!places.length) return { added: 0 };
  const rows = await db
    .insert(enterprises)
    .values(
      places.map((p) => ({
        contractorId: contractor.id,
        name: p.name,
        phone: p.phone,
        categoryId: p.categoryId,
        lat: p.lat,
        lng: p.lng,
        areaName: p.areaName ?? contractor.areaName,
        source: "osm" as const,
        sourceRef: p.osmId,
      })),
    )
    .onConflictDoNothing()
    .returning({ id: enterprises.id });
  revalidatePath("/", "layout");
  return { added: rows.length };
}
