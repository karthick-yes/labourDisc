import { and, eq, isNotNull } from "drizzle-orm";
import { CATEGORIES } from "@/config/categories";
import {
  DEMO_FIRST_NAMES,
  DEMO_HOME_STATES,
  DEMO_LAST_NAMES,
  DEMO_NEED_SHARE,
  DEMO_NEED_SHARE_OTHER,
  DEMO_RATING_NOTES,
  DEMO_SKILL_WEIGHTS,
  DEMO_WELDER_WORKSHOP_NAME,
  DEMO_WORKER_COUNT,
} from "@/config/demo";
import { DEMO_RADIUS_KM } from "@/config/osm-import";
import { WAGE_RANGES } from "@/config/wages";
import { db } from "@/db";
import { enterprises, needs, placements, ratings, workerSkills, workers } from "@/db/schema";
import { distanceKm, type LatLng } from "@/lib/geo";
import { placesNear } from "@/lib/osm/load";
import { normalizePhone } from "@/lib/phone";
import { newShareToken } from "@/lib/tokens";
import { createRng, type Rng } from "./random";

// Demo mode (brief §4): real local businesses from OpenStreetMap plus sample
// needs, workers and placements. The shops are real and are kept as normal
// records; only the sample needs/workers/placements are is_demo, and clearing
// demo data removes just those. Everything belongs to one contractor only.

type Contractor = { id: string; baseLat: number | null; baseLng: number | null; areaName: string | null };

const roundTo50 = (n: number) => Math.round(n / 50) * 50;
const wageFor = (rng: Rng, skillId: string) => {
  const [min, max] = WAGE_RANGES[skillId] ?? [700, 1000];
  return roundTo50(rng.int(min, max));
};
const isoDate = (daysFromToday: number) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  return d.toISOString().slice(0, 10);
};
const rolesFor = new Map(CATEGORIES.map((c) => [c.id, c.roles]));

export async function clearDemoData(contractorId: string) {
  await db.transaction(async (tx) => {
    // Placements and ratings go with their demo worker/need (cascade).
    await tx.delete(workers).where(and(eq(workers.contractorId, contractorId), eq(workers.isDemo, true)));
    await tx.delete(needs).where(and(eq(needs.contractorId, contractorId), eq(needs.isDemo, true)));
  });
}

export type DemoResult = {
  enterprises: number;
  needs: number;
  workers: number;
  placements: number;
  source: string;
  liveError: string | null;
};

export async function loadDemoData(contractor: Contractor): Promise<DemoResult> {
  if (contractor.baseLat == null || contractor.baseLng == null) throw new Error("noLocation");
  const base: LatLng = { lat: contractor.baseLat, lng: contractor.baseLng };
  const rng = createRng(contractor.id);

  const { places, source, liveError } = await placesNear(base, undefined, contractor.id);
  await clearDemoData(contractor.id);

  return db.transaction(async (tx) => {
    // ---- Enterprises: real OSM places, added once and kept as real shops ----
    for (let i = 0; i < places.length; i += 500) {
      await tx
        .insert(enterprises)
        .values(
          places.slice(i, i + 500).map((p) => ({
            contractorId: contractor.id,
            name: p.name,
            phone: p.phone ? normalizePhone(p.phone) : null,
            categoryId: p.categoryId,
            lat: p.lat,
            lng: p.lng,
            areaName: p.areaName ?? contractor.areaName,
            source: "osm" as const,
            sourceRef: p.osmId,
          })),
        )
        .onConflictDoNothing();
    }
    const entRows = (
      await tx
        .select({ id: enterprises.id, name: enterprises.name, categoryId: enterprises.categoryId, lat: enterprises.lat, lng: enterprises.lng })
        .from(enterprises)
        .where(and(eq(enterprises.contractorId, contractor.id), isNotNull(enterprises.lat)))
    ).filter((e) => distanceKm(base, { lat: e.lat!, lng: e.lng! }) <= DEMO_RADIUS_KM);
    const withDistance = entRows
      .map((e) => ({ ...e, km: distanceKm(base, { lat: e.lat!, lng: e.lng! }) }))
      .sort((a, b) => a.km - b.km);

    // ---- Open needs for ~30% of enterprises ----
    type NeedRow = typeof needs.$inferInsert;
    const needRows: NeedRow[] = [];
    const demoNeed = (enterpriseId: string, skillId: string, extra: Partial<NeedRow> = {}): NeedRow => ({
      contractorId: contractor.id,
      enterpriseId,
      skillId,
      countNeeded: rng.chance(0.7) ? 1 : rng.int(2, 3),
      wageOffered: wageFor(rng, skillId),
      startDate: isoDate(rng.int(0, 10)),
      status: "open",
      isDemo: true,
      ...extra,
    });

    // Guarantee the demo-script case: a nearby workshop needing a welder.
    const workshop =
      withDistance.find((e) => e.categoryId === "workshop" && e.km <= 5 && DEMO_WELDER_WORKSHOP_NAME.test(e.name)) ??
      withDistance.find((e) => e.categoryId === "workshop" && e.km <= 5) ??
      withDistance.find((e) => (e.categoryId === "workshop" || e.categoryId === "industrial") && e.km <= 15) ??
      withDistance[0];
    if (workshop) needRows.push(demoNeed(workshop.id, "welder", { countNeeded: 2, wageOffered: 1250, startDate: isoDate(1) }));

    for (const e of withDistance) {
      const share = e.categoryId === "other" ? DEMO_NEED_SHARE_OTHER : DEMO_NEED_SHARE;
      if (e.id === workshop?.id || !rng.chance(share)) continue;
      const roles = rolesFor.get(e.categoryId ?? "other") ?? [];
      if (roles.length) needRows.push(demoNeed(e.id, rng.pick(roles)));
    }
    const insertedNeeds = needRows.length
      ? await tx.insert(needs).values(needRows).returning({ id: needs.id, enterpriseId: needs.enterpriseId })
      : [];

    // ---- Workers ----
    const names = rng.shuffle(DEMO_FIRST_NAMES.flatMap((f) => DEMO_LAST_NAMES.map((l) => `${f} ${l}`)));
    const stateWeights = Object.fromEntries(DEMO_HOME_STATES.map((s) => [s.state, s.weight]));
    const workerPlans = Array.from({ length: DEMO_WORKER_COUNT }, (_, i) => {
      // First worker is always a welder, so the welder need has a strong match.
      const primary = i === 0 ? "welder" : rng.weighted(DEMO_SKILL_WEIGHTS);
      const skills = [{ skillId: primary, years: i === 0 ? 6 : rng.int(1, 12) }];
      if (primary !== "helper" && rng.chance(0.35)) skills.push({ skillId: "helper", years: rng.int(1, 5) });
      const state = rng.weighted(stateWeights);
      return {
        name: names[i],
        homeState: state,
        languages: DEMO_HOME_STATES.find((s) => s.state === state)!.languages,
        expectedWage: i === 0 ? 1200 : wageFor(rng, primary),
        mediaConsent: rng.chance(0.8),
        skills,
      };
    });
    const insertedWorkers = await tx
      .insert(workers)
      .values(
        workerPlans.map((w) => ({
          name: w.name,
          homeState: w.homeState,
          languages: w.languages,
          expectedWage: w.expectedWage,
          mediaConsent: w.mediaConsent,
          contractorId: contractor.id,
          shareToken: newShareToken(),
          isDemo: true,
        })),
      )
      .returning({ id: workers.id });
    await tx.insert(workerSkills).values(
      insertedWorkers.flatMap((w, i) => workerPlans[i].skills.map((s) => ({ ...s, workerId: w.id }))),
    );

    // ---- Past placements, ratings, and two live ones for the home screen ----
    let placementCount = 0;
    const pastEnterprises = withDistance.slice(0, 60);
    const place = async (
      workerIdx: number,
      opts: {
        daysAgo: number;
        probationDays: number;
        status: "awaiting_payment" | "trial" | "confirmed" | "ended";
        commission: "unpaid" | "at_risk" | "earned";
        rating?: number;
      },
    ) => {
      if (!pastEnterprises.length) return;
      const plan = workerPlans[workerIdx];
      const skillId = plan.skills[0].skillId;
      const wage = plan.expectedWage;
      const [need] = await tx
        .insert(needs)
        .values({
          contractorId: contractor.id,
          enterpriseId: rng.pick(pastEnterprises).id,
          skillId,
          countNeeded: 1,
          countFilled: 1,
          wageOffered: wage,
          startDate: isoDate(-opts.daysAgo),
          status: "filled",
          isDemo: true,
        })
        .returning({ id: needs.id });
      const [p] = await tx
        .insert(placements)
        .values({
          contractorId: contractor.id,
          workerId: insertedWorkers[workerIdx].id,
          needId: need.id,
          startDate: isoDate(-opts.daysAgo),
          wage,
          probationDays: opts.probationDays,
          status: opts.status,
          commissionAmount: wage,
          commissionStatus: opts.commission,
          // Shops pay upfront, on the day the worker is sent.
          commissionReceivedAt: opts.commission === "unpaid" ? null : new Date(Date.now() - opts.daysAgo * 86_400_000),
        })
        .returning({ id: placements.id });
      placementCount++;
      if (opts.rating) {
        await tx.insert(ratings).values({
          contractorId: contractor.id,
          placementId: p.id,
          workerId: insertedWorkers[workerIdx].id,
          score: opts.rating,
          note: rng.pick(DEMO_RATING_NOTES),
        });
      }
      if (opts.status !== "ended") {
        await tx.update(workers).set({ availability: "placed" }).where(eq(workers.id, insertedWorkers[workerIdx].id));
      }
    };

    // Rated past jobs: worker 0 (the welder) has two good ratings.
    await place(0, { daysAgo: 120, probationDays: 7, status: "ended", commission: "earned", rating: 5 });
    await place(0, { daysAgo: 60, probationDays: 7, status: "ended", commission: "earned", rating: 4 });
    for (let i = 1; i <= 8; i++) {
      await place(i, { daysAgo: rng.int(30, 200), probationDays: 7, status: "ended", commission: "earned", rating: rng.int(3, 5) });
    }
    // Live ones for the home screen: earned this month, a trial ending
    // tomorrow (money at risk), and a worker waiting for the shop to pay.
    await place(DEMO_WORKER_COUNT - 1, { daysAgo: 12, probationDays: 7, status: "confirmed", commission: "earned", rating: 4 });
    await place(DEMO_WORKER_COUNT - 2, { daysAgo: 6, probationDays: 7, status: "trial", commission: "at_risk" });
    await place(DEMO_WORKER_COUNT - 3, { daysAgo: -1, probationDays: 7, status: "awaiting_payment", commission: "unpaid" });

    return {
      enterprises: entRows.length,
      needs: insertedNeeds.length,
      workers: insertedWorkers.length,
      placements: placementCount,
      source,
      liveError,
    };
  });
}

/** Sample workers or needs are loaded (drives the header info button). */
export async function hasDemoData(contractorId: string) {
  const [w] = await db
    .select({ id: workers.id })
    .from(workers)
    .where(and(eq(workers.contractorId, contractorId), eq(workers.isDemo, true)))
    .limit(1);
  if (w) return true;
  const [n] = await db
    .select({ id: needs.id })
    .from(needs)
    .where(and(eq(needs.contractorId, contractorId), eq(needs.isDemo, true)))
    .limit(1);
  return Boolean(n);
}
