import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { enterprises, needs, placements, ratings, workers } from "@/db/schema";

// Placements and the money tracker, as contractors actually work:
//   1. Mark placed: worker reserved, shop owes the commission (unpaid).
//   2. Shop pays upfront -> worker is sent; trial starts; commission is
//      paid but at risk (guarantee period).
//   3. Trial passes -> commission earned.
//   Worker fails during trial -> refund, or send a replacement (commission
//   moves to the replacement's placement and its trial restarts).
//   Shop backs out before paying -> cancelled, commission lost.

export type PlacementStatus = (typeof placements.$inferSelect)["status"];
export type CommissionStatus = (typeof placements.$inferSelect)["commissionStatus"];

const TODAY = sql`(now() at time zone 'Asia/Kolkata')::date`;
const MONTH_START = sql`date_trunc('month', now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata'`;

/**
 * When the trial ends with the worker still there, the commission is earned
 * and the placement confirmed. Run lazily whenever placements are shown.
 */
export async function advanceCommissions(contractorId: string) {
  await db
    .update(placements)
    .set({ status: "confirmed", commissionStatus: "earned" })
    .where(
      and(
        eq(placements.contractorId, contractorId),
        eq(placements.status, "trial"),
        eq(placements.commissionStatus, "at_risk"),
        sql`${placements.startDate} + ${placements.probationDays} <= ${TODAY}`,
      ),
    );
}

const listColumns = {
  id: placements.id,
  status: placements.status,
  startDate: placements.startDate,
  probationDays: placements.probationDays,
  wage: placements.wage,
  commissionAmount: placements.commissionAmount,
  commissionStatus: placements.commissionStatus,
  commissionReceivedAt: placements.commissionReceivedAt,
  replacementFor: placements.replacementFor,
  workerId: workers.id,
  workerName: workers.name,
  workerPhotoUrl: workers.photoUrl,
  needId: needs.id,
  enterpriseId: enterprises.id,
  enterpriseName: enterprises.name,
  enterprisePhone: enterprises.phone,
  skillId: needs.skillId,
  isDemo: sql<boolean>`(${workers.isDemo} or ${needs.isDemo})`,
  rated: sql<boolean>`exists (select 1 from "ratings" r where r."placement_id" = "placements"."id")`,
};

export type PlacementFilter = "unpaid" | "trial" | "earned";

export async function listPlacements(contractorId: string, filter?: PlacementFilter, workerId?: string) {
  const where = [eq(placements.contractorId, contractorId)];
  if (workerId) where.push(eq(placements.workerId, workerId));
  if (filter === "unpaid") where.push(eq(placements.commissionStatus, "unpaid"));
  if (filter === "trial") where.push(eq(placements.status, "trial"));
  if (filter === "earned") where.push(eq(placements.commissionStatus, "earned"));
  return db
    .select(listColumns)
    .from(placements)
    .innerJoin(workers, eq(workers.id, placements.workerId))
    .innerJoin(needs, eq(needs.id, placements.needId))
    .innerJoin(enterprises, eq(enterprises.id, needs.enterpriseId))
    .where(and(...where))
    .orderBy(
      sql`case ${placements.commissionStatus} when 'unpaid' then 0 when 'at_risk' then 1 else 2 end`,
      desc(placements.startDate),
    );
}

export type PlacementListItem = Awaited<ReturnType<typeof listPlacements>>[number];

/** Money figures for the home screen and placements header. */
export async function moneySummary(contractorId: string) {
  const [row] = await db
    .select({
      toCollect: sql<number>`coalesce(sum(${placements.commissionAmount}) filter (where ${placements.commissionStatus} = 'unpaid'), 0)::int`,
      toCollectCount: sql<number>`(count(*) filter (where ${placements.commissionStatus} = 'unpaid'))::int`,
      atRisk: sql<number>`coalesce(sum(${placements.commissionAmount}) filter (where ${placements.commissionStatus} = 'at_risk'), 0)::int`,
      earnedThisMonth: sql<number>`coalesce(sum(${placements.commissionAmount}) filter (where ${placements.commissionStatus} = 'earned' and ${placements.commissionReceivedAt} >= ${MONTH_START}), 0)::int`,
    })
    .from(placements)
    .where(eq(placements.contractorId, contractorId));
  return row;
}

export async function getPlacement(contractorId: string, id: string) {
  const [row] = await db
    .select({ ...listColumns, needCount: needs.countNeeded, needFilled: needs.countFilled })
    .from(placements)
    .innerJoin(workers, eq(workers.id, placements.workerId))
    .innerJoin(needs, eq(needs.id, placements.needId))
    .innerJoin(enterprises, eq(enterprises.id, needs.enterpriseId))
    .where(and(eq(placements.contractorId, contractorId), eq(placements.id, id)))
    .limit(1);
  if (!row) return null;
  const linked = (where: ReturnType<typeof and>) =>
    db
      .select({ id: placements.id, workerName: workers.name })
      .from(placements)
      .innerJoin(workers, eq(workers.id, placements.workerId))
      .where(where)
      .limit(1);
  const [[rating], [replacedBy], [replaces]] = await Promise.all([
    db.select().from(ratings).where(eq(ratings.placementId, id)).limit(1),
    linked(and(eq(placements.contractorId, contractorId), eq(placements.replacementFor, id))),
    row.replacementFor
      ? linked(and(eq(placements.contractorId, contractorId), eq(placements.id, row.replacementFor)))
      : Promise.resolve([]),
  ]);
  return { ...row, rating: rating ?? null, replacedBy: replacedBy ?? null, replaces: replaces ?? null };
}

export type PlacementDetail = NonNullable<Awaited<ReturnType<typeof getPlacement>>>;

export type PlacementInput = {
  workerId: string;
  needId: string;
  startDate: string;
  wage: number;
  commissionAmount: number;
  probationDays: number;
};

/** Mark placed: reserves the worker and a slot of the need; commission unpaid. */
export async function createPlacement(contractorId: string, input: PlacementInput) {
  return db.transaction(async (tx) => {
    const [worker] = await tx
      .select({ id: workers.id })
      .from(workers)
      .where(and(eq(workers.contractorId, contractorId), eq(workers.id, input.workerId)));
    const [need] = await tx
      .select({ id: needs.id, countNeeded: needs.countNeeded, countFilled: needs.countFilled })
      .from(needs)
      .where(and(eq(needs.contractorId, contractorId), eq(needs.id, input.needId)));
    if (!worker || !need) return null;

    const [created] = await tx
      .insert(placements)
      .values({ ...input, contractorId, status: "awaiting_payment", commissionStatus: "unpaid" })
      .returning({ id: placements.id });
    const filled = need.countFilled + 1;
    await tx
      .update(needs)
      .set({ countFilled: filled, ...(filled >= need.countNeeded ? { status: "filled" as const } : {}) })
      .where(eq(needs.id, need.id));
    await tx.update(workers).set({ availability: "placed" }).where(eq(workers.id, worker.id));
    return created.id;
  });
}

export type PlacementAction = "paid" | "cancel" | "confirm" | "end" | "refund";

/** One lifecycle step, keeping the worker's availability and the need in sync. */
export async function applyPlacementAction(contractorId: string, id: string, action: PlacementAction) {
  return db.transaction(async (tx) => {
    const [p] = await tx
      .select()
      .from(placements)
      .where(and(eq(placements.contractorId, contractorId), eq(placements.id, id)));
    if (!p) return false;

    const setPlacement = (values: Partial<typeof placements.$inferInsert>) =>
      tx.update(placements).set(values).where(eq(placements.id, id));
    const freeWorker = () => tx.update(workers).set({ availability: "available" }).where(eq(workers.id, p.workerId));
    const reopenSlot = () =>
      tx
        .update(needs)
        .set({ countFilled: sql`greatest(${needs.countFilled} - 1, 0)`, status: "open" })
        .where(and(eq(needs.id, p.needId), sql`${needs.status} <> 'cancelled'`));

    switch (action) {
      case "paid": {
        // Commission in hand: the worker is sent and the trial starts on the
        // planned start date, or today if that has already passed.
        if (p.status !== "awaiting_payment") return false;
        const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
        await setPlacement({
          status: "trial",
          commissionStatus: "at_risk",
          commissionReceivedAt: new Date(),
          startDate: p.startDate > today ? p.startDate : today,
        });
        return true;
      }
      case "cancel":
        if (p.status !== "awaiting_payment") return false;
        await setPlacement({ status: "cancelled", commissionStatus: "lost" });
        await freeWorker();
        await reopenSlot();
        return true;
      case "confirm":
        if (p.status !== "trial") return false;
        await setPlacement({ status: "confirmed", commissionStatus: "earned" });
        return true;
      case "end":
        // Job finished normally (also ends a trial early: the shop is satisfied).
        if (p.status !== "trial" && p.status !== "confirmed") return false;
        await setPlacement({ status: "ended", commissionStatus: "earned" });
        await freeWorker();
        return true;
      case "refund":
        // Worker failed during the trial and the contractor gives the money back.
        if (p.status !== "trial") return false;
        await setPlacement({ status: "failed", commissionStatus: "refunded" });
        await freeWorker();
        await reopenSlot();
        return true;
    }
  });
}

/**
 * Worker failed during the trial; the contractor sends another worker
 * instead of refunding. The paid commission moves to the new placement and
 * the trial starts again from today.
 */
export async function replacePlacement(contractorId: string, id: string, newWorkerId: string) {
  return db.transaction(async (tx) => {
    const [p] = await tx
      .select()
      .from(placements)
      .where(and(eq(placements.contractorId, contractorId), eq(placements.id, id)));
    const [w] = await tx
      .select({ id: workers.id, availability: workers.availability })
      .from(workers)
      .where(and(eq(workers.contractorId, contractorId), eq(workers.id, newWorkerId)));
    if (!p || p.status !== "trial" || !w || w.id === p.workerId || w.availability !== "available") return null;

    await tx.update(placements).set({ status: "failed", commissionStatus: "transferred" }).where(eq(placements.id, id));
    await tx.update(workers).set({ availability: "available" }).where(eq(workers.id, p.workerId));
    const [created] = await tx
      .insert(placements)
      .values({
        contractorId,
        workerId: w.id,
        needId: p.needId,
        startDate: new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }),
        wage: p.wage,
        probationDays: p.probationDays,
        status: "trial",
        commissionAmount: p.commissionAmount,
        commissionStatus: "at_risk",
        commissionReceivedAt: p.commissionReceivedAt,
        replacementFor: p.id,
      })
      .returning({ id: placements.id });
    await tx.update(workers).set({ availability: "placed" }).where(eq(workers.id, w.id));
    return created.id;
  });
}

export async function ratePlacement(contractorId: string, id: string, score: number, note: string | null) {
  const [p] = await db
    .select({ workerId: placements.workerId })
    .from(placements)
    .where(and(eq(placements.contractorId, contractorId), eq(placements.id, id)));
  if (!p) return false;
  await db.delete(ratings).where(eq(ratings.placementId, id));
  await db.insert(ratings).values({ contractorId, placementId: id, workerId: p.workerId, score, note });
  return true;
}

/** Placement form defaults for a worker + need pair. */
export async function placementDraft(contractorId: string, workerId: string, needId: string) {
  const [row] = await db
    .select({
      workerName: workers.name,
      workerWage: workers.expectedWage,
      needWage: needs.wageOffered,
      skillId: needs.skillId,
      enterpriseName: enterprises.name,
      needStatus: needs.status,
    })
    .from(workers)
    .innerJoin(needs, eq(needs.contractorId, workers.contractorId))
    .innerJoin(enterprises, eq(enterprises.id, needs.enterpriseId))
    .where(and(eq(workers.contractorId, contractorId), eq(workers.id, workerId), eq(needs.id, needId)))
    .limit(1);
  return row ?? null;
}
