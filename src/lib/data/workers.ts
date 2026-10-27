import "server-only";
import { and, avg, count, desc, eq, ilike, inArray, isNotNull, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { contractors, ratings, workerMedia, workerSkills, workers } from "@/db/schema";
import { newShareToken } from "@/lib/tokens";
import { getSkills, skillIdsMatching } from "./reference";

export type Availability = (typeof workers.$inferSelect)["availability"];
export type WorkerSkill = { skillId: string; years: number | null };
export type RatingSummary = { avg: number | null; count: number };

export type WorkerInput = {
  name: string;
  homeState: string | null;
  languages: string[];
  expectedWage: number | null;
  availability: Availability;
  notes: string | null;
  mediaConsent: boolean;
  skills: WorkerSkill[];
  transcript?: string | null;
  voiceNoteUrl?: string | null;
};

async function skillsFor(workerIds: string[]) {
  const map = new Map<string, WorkerSkill[]>();
  if (!workerIds.length) return map;
  const rows = await db
    .select({ workerId: workerSkills.workerId, skillId: workerSkills.skillId, years: workerSkills.years })
    .from(workerSkills)
    .where(inArray(workerSkills.workerId, workerIds));
  for (const r of rows) {
    const list = map.get(r.workerId) ?? [];
    list.push({ skillId: r.skillId, years: r.years });
    map.set(r.workerId, list);
  }
  for (const list of map.values()) list.sort((a, b) => (b.years ?? 0) - (a.years ?? 0));
  return map;
}

export async function ratingsFor(contractorId: string, workerIds: string[]) {
  const map = new Map<string, RatingSummary>();
  if (!workerIds.length) return map;
  const rows = await db
    .select({ workerId: ratings.workerId, avg: avg(ratings.score), count: count() })
    .from(ratings)
    .where(and(eq(ratings.contractorId, contractorId), inArray(ratings.workerId, workerIds)))
    .groupBy(ratings.workerId);
  for (const r of rows) map.set(r.workerId, { avg: r.avg == null ? null : Number(r.avg), count: r.count });
  return map;
}

export type WorkerListItem = Awaited<ReturnType<typeof listWorkers>>[number];

export async function listWorkers(
  contractorId: string,
  opts: { availability?: Availability; q?: string; limit?: number } = {},
) {
  const filters: (SQL | undefined)[] = [eq(workers.contractorId, contractorId)];
  if (opts.availability) filters.push(eq(workers.availability, opts.availability));
  const q = opts.q?.trim();
  if (q) {
    const skillIds = skillIdsMatching(await getSkills(), q);
    const bySkill = skillIds.length
      ? db.select({ id: workerSkills.workerId }).from(workerSkills).where(inArray(workerSkills.skillId, skillIds))
      : null;
    filters.push(
      or(
        ilike(workers.name, `%${q}%`),
        ilike(workers.homeState, `%${q}%`),
        bySkill ? inArray(workers.id, bySkill) : undefined,
      ),
    );
  }

  const rows = await db
    .select({
      id: workers.id,
      name: workers.name,
      photoUrl: workers.photoUrl,
      homeState: workers.homeState,
      expectedWage: workers.expectedWage,
      availability: workers.availability,
      isDemo: workers.isDemo,
      createdAt: workers.createdAt,
    })
    .from(workers)
    .where(and(...filters))
    .orderBy(desc(workers.createdAt))
    .limit(opts.limit ?? 200);

  const ids = rows.map((r) => r.id);
  const [skillMap, ratingMap] = await Promise.all([skillsFor(ids), ratingsFor(contractorId, ids)]);
  return rows.map((r) => ({
    ...r,
    skills: skillMap.get(r.id) ?? [],
    rating: ratingMap.get(r.id) ?? { avg: null, count: 0 },
  }));
}

export async function getWorker(contractorId: string, id: string) {
  const [row] = await db
    .select()
    .from(workers)
    .where(and(eq(workers.contractorId, contractorId), eq(workers.id, id)))
    .limit(1);
  if (!row) return null;
  const [skillMap, ratingMap, ratingRows, videoUrl] = await Promise.all([
    skillsFor([id]),
    ratingsFor(contractorId, [id]),
    db
      .select({ score: ratings.score, note: ratings.note, createdAt: ratings.createdAt })
      .from(ratings)
      .where(and(eq(ratings.contractorId, contractorId), eq(ratings.workerId, id)))
      .orderBy(desc(ratings.createdAt))
      .limit(10),
    latestVideo(id),
  ]);
  return {
    ...row,
    videoUrl,
    skills: skillMap.get(id) ?? [],
    rating: ratingMap.get(id) ?? { avg: null, count: 0 },
    ratingNotes: ratingRows,
  };
}

export type WorkerDetail = NonNullable<Awaited<ReturnType<typeof getWorker>>>;

export async function createWorker(
  contractorId: string,
  input: WorkerInput & { photoUrl?: string | null; id?: string },
) {
  return db.transaction(async (tx) => {
    const { skills, ...fields } = input;
    const [created] = await tx
      .insert(workers)
      .values({ ...fields, contractorId, shareToken: newShareToken() })
      .returning({ id: workers.id });
    if (skills.length) {
      await tx.insert(workerSkills).values(skills.map((s) => ({ ...s, workerId: created.id })));
    }
    return created.id;
  });
}

export async function updateWorker(
  contractorId: string,
  id: string,
  input: WorkerInput & { photoUrl?: string | null },
) {
  return db.transaction(async (tx) => {
    const { skills, ...fields } = input;
    const updated = await tx
      .update(workers)
      .set(fields)
      .where(and(eq(workers.contractorId, contractorId), eq(workers.id, id)))
      .returning({ id: workers.id });
    if (!updated.length) return false;
    await tx.delete(workerSkills).where(eq(workerSkills.workerId, id));
    if (skills.length) {
      await tx.insert(workerSkills).values(skills.map((s) => ({ ...s, workerId: id })));
    }
    return true;
  });
}

export async function setWorkerAvailability(contractorId: string, id: string, availability: Availability) {
  await db
    .update(workers)
    .set({ availability })
    .where(and(eq(workers.contractorId, contractorId), eq(workers.id, id)));
}

/** New public link (old one stops working), or null to revoke. */
export async function setShareToken(contractorId: string, id: string, token: string | null) {
  await db
    .update(workers)
    .set({ shareToken: token })
    .where(and(eq(workers.contractorId, contractorId), eq(workers.id, id)));
}

export async function deleteWorker(contractorId: string, id: string) {
  const [row] = await db
    .delete(workers)
    .where(and(eq(workers.contractorId, contractorId), eq(workers.id, id)))
    .returning({ photoUrl: workers.photoUrl, voiceNoteUrl: workers.voiceNoteUrl });
  return row ?? null;
}

/**
 * Public profile by share token. Returns only what an employer may see:
 * no worker phone, no home address, photo only with consent.
 */
export async function getPublicWorker(token: string) {
  const [row] = await db
    .select({
      id: workers.id,
      contractorId: workers.contractorId,
      name: workers.name,
      photoUrl: workers.photoUrl,
      mediaConsent: workers.mediaConsent,
      homeState: workers.homeState,
      languages: workers.languages,
      expectedWage: workers.expectedWage,
      availability: workers.availability,
      contractorName: contractors.name,
      contractorPhone: contractors.phone,
    })
    .from(workers)
    .innerJoin(contractors, eq(contractors.id, workers.contractorId))
    .where(and(eq(workers.shareToken, token), isNotNull(workers.shareToken)))
    .limit(1);
  if (!row) return null;
  const [skillMap, ratingMap, videoUrl] = await Promise.all([
    skillsFor([row.id]),
    ratingsFor(row.contractorId, [row.id]),
    row.mediaConsent ? latestVideo(row.id) : Promise.resolve(null),
  ]);
  return {
    videoUrl,
    name: row.name,
    homeState: row.homeState,
    languages: row.languages,
    expectedWage: row.expectedWage,
    availability: row.availability,
    contractorName: row.contractorName,
    contractorPhone: row.contractorPhone,
    photoUrl: row.mediaConsent ? row.photoUrl : null,
    skills: skillMap.get(row.id) ?? [],
    rating: ratingMap.get(row.id) ?? { avg: null, count: 0 },
  };
}

async function latestVideo(workerId: string) {
  const [v] = await db
    .select({ url: workerMedia.url })
    .from(workerMedia)
    .where(and(eq(workerMedia.workerId, workerId), eq(workerMedia.type, "video")))
    .orderBy(desc(workerMedia.createdAt))
    .limit(1);
  return v?.url ?? null;
}

/** Replaces the worker's skill video; returns the old URLs so files can be removed. */
export async function setWorkerVideo(contractorId: string, workerId: string, url: string) {
  return db.transaction(async (tx) => {
    const old = await tx
      .delete(workerMedia)
      .where(and(eq(workerMedia.contractorId, contractorId), eq(workerMedia.workerId, workerId), eq(workerMedia.type, "video")))
      .returning({ url: workerMedia.url });
    await tx.insert(workerMedia).values({ contractorId, workerId, type: "video", url });
    return old.map((o) => o.url);
  });
}

/** Media URLs owned by a worker (for deleting files with the worker). */
export async function workerMediaUrls(contractorId: string, workerId: string) {
  const rows = await db
    .select({ url: workerMedia.url })
    .from(workerMedia)
    .where(and(eq(workerMedia.contractorId, contractorId), eq(workerMedia.workerId, workerId)));
  return rows.map((r) => r.url);
}

/**
 * Can this media URL be served publicly? Only a worker's photo or skill
 * video, with media consent and a live share link.
 */
export async function isPublicMedia(url: string) {
  const [row] = await db
    .select({ id: workers.id })
    .from(workers)
    .where(
      and(
        eq(workers.mediaConsent, true),
        isNotNull(workers.shareToken),
        or(
          eq(workers.photoUrl, url),
          sql`exists (select 1 from "worker_media" m where m."worker_id" = "workers"."id" and m."url" = ${url})`,
        ),
      ),
    )
    .limit(1);
  return Boolean(row);
}
