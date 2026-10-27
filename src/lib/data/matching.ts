import "server-only";
import { and, eq, inArray, lt } from "drizzle-orm";
import { MATCH_LIST_LIMIT } from "@/config/matching";
import { db } from "@/db";
import { enterprises, needs, workerSkills, workers } from "@/db/schema";
import type { CurrentContractor } from "@/lib/auth/session";
import { maybeDistanceKm } from "@/lib/geo";
import { scoreMatch, type ScoreResult } from "@/lib/matching/score";
import { ratingsFor, type WorkerDetail } from "./workers";

const base = (c: CurrentContractor) => ({ lat: c.baseLat, lng: c.baseLng });

/** Open, unfilled needs ranked for one worker. */
export async function matchesForWorker(contractor: CurrentContractor, worker: WorkerDetail) {
  if (worker.availability !== "available" || !worker.skills.length) return [];

  const rows = await db
    .select({
      needId: needs.id,
      skillId: needs.skillId,
      countNeeded: needs.countNeeded,
      countFilled: needs.countFilled,
      wageOffered: needs.wageOffered,
      startDate: needs.startDate,
      isDemo: needs.isDemo,
      enterpriseId: enterprises.id,
      enterpriseName: enterprises.name,
      enterprisePhone: enterprises.phone,
      enterpriseArea: enterprises.areaName,
      enterpriseIsDemo: enterprises.isDemo,
      lat: enterprises.lat,
      lng: enterprises.lng,
    })
    .from(needs)
    .innerJoin(enterprises, eq(enterprises.id, needs.enterpriseId))
    .where(
      and(
        eq(needs.contractorId, contractor.id),
        eq(needs.status, "open"),
        lt(needs.countFilled, needs.countNeeded),
      ),
    );

  const results: (typeof rows[number] & { distanceKm: number | null; match: ScoreResult })[] = [];
  for (const n of rows) {
    const distanceKm = maybeDistanceKm(n, base(contractor));
    const match = scoreMatch({
      need: { skillId: n.skillId, wageOffered: n.wageOffered, distanceKm },
      worker: { skills: worker.skills, expectedWage: worker.expectedWage, avgRating: worker.rating.avg },
    });
    if (match) results.push({ ...n, distanceKm, match });
  }
  return rank(results);
}

export type NeedMatch = Awaited<ReturnType<typeof matchesForWorker>>[number];

/** Available workers ranked for one need. */
export async function matchesForNeed(
  contractor: CurrentContractor,
  need: { skillId: string; wageOffered: number | null; enterpriseLat: number | null; enterpriseLng: number | null },
) {
  const workerRows = await db
    .select({
      id: workers.id,
      name: workers.name,
      photoUrl: workers.photoUrl,
      homeState: workers.homeState,
      expectedWage: workers.expectedWage,
      isDemo: workers.isDemo,
      shareToken: workers.shareToken,
    })
    .from(workers)
    .where(and(eq(workers.contractorId, contractor.id), eq(workers.availability, "available")));
  if (!workerRows.length) return [];

  const ids = workerRows.map((w) => w.id);
  const [skillRows, ratingMap] = await Promise.all([
    db.select().from(workerSkills).where(inArray(workerSkills.workerId, ids)),
    ratingsFor(contractor.id, ids),
  ]);
  const skillMap = new Map<string, { skillId: string; years: number | null }[]>();
  for (const s of skillRows) {
    skillMap.set(s.workerId, [...(skillMap.get(s.workerId) ?? []), { skillId: s.skillId, years: s.years }]);
  }

  // Workers have no fixed location, so distance is enterprise -> base (brief §7).
  const distanceKm = maybeDistanceKm({ lat: need.enterpriseLat, lng: need.enterpriseLng }, base(contractor));
  const results = [];
  for (const w of workerRows) {
    const rating = ratingMap.get(w.id) ?? { avg: null, count: 0 };
    const match = scoreMatch({
      need: { skillId: need.skillId, wageOffered: need.wageOffered, distanceKm },
      worker: { skills: skillMap.get(w.id) ?? [], expectedWage: w.expectedWage, avgRating: rating.avg },
    });
    if (match) results.push({ ...w, rating, distanceKm, match });
  }
  return rank(results);
}

export type WorkerMatch = Awaited<ReturnType<typeof matchesForNeed>>[number];

function rank<T extends { match: ScoreResult }>(list: T[]) {
  return list.sort((a, b) => b.match.score - a.match.score).slice(0, MATCH_LIST_LIMIT);
}
