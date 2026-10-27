// Integration test (needs DATABASE_URL): the upfront-commission lifecycle
// keeps the need, the worker's availability and the money in step.
import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/db";
import { contractors, placements } from "@/db/schema";
import { createEnterprise } from "./enterprises";
import { createNeed, getNeed } from "./needs";
import {
  advanceCommissions,
  applyPlacementAction,
  createPlacement,
  getPlacement,
  listPlacements,
  moneySummary,
  ratePlacement,
  replacePlacement,
} from "./placements";
import { createWorker, getWorker } from "./workers";

const phones = ["910000000009", "910000000010"];
let contractorId: string;
let otherId: string;
let needId: string;
const w: Record<string, string> = {};

const worker = (name: string) => ({
  name,
  homeState: null,
  languages: [],
  expectedWage: 1000,
  availability: "available" as const,
  notes: null,
  mediaConsent: false,
  skills: [{ skillId: "loader", years: 2 }],
});
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
const place = (workerId: string) =>
  createPlacement(contractorId, { workerId, needId, startDate: today(), wage: 900, commissionAmount: 900, probationDays: 7 });

beforeAll(async () => {
  await db.delete(contractors).where(inArray(contractors.phone, phones));
  const [c, o] = await db
    .insert(contractors)
    .values([
      { name: "P", phone: phones[0], pinHash: "x" },
      { name: "O", phone: phones[1], pinHash: "x" },
    ])
    .returning();
  contractorId = c.id;
  otherId = o.id;
  const ent = await createEnterprise(contractorId, { name: "Shop", phone: null, categoryId: null, lat: null, lng: null, areaName: null, notes: null });
  needId = (await createNeed(contractorId, { enterpriseId: ent, skillId: "loader", countNeeded: 3, wageOffered: 900, startDate: null, notes: null }))!;
  for (const n of ["A", "B", "C", "D"]) w[n] = await createWorker(contractorId, worker(n));
});

afterAll(async () => {
  await db.delete(contractors).where(inArray(contractors.phone, phones));
});

describe("upfront commission lifecycle", () => {
  it("mark placed reserves the worker and a slot; commission unpaid", async () => {
    const id = (await place(w.A))!;
    expect(await getPlacement(contractorId, id)).toMatchObject({ status: "awaiting_payment", commissionStatus: "unpaid" });
    expect((await getWorker(contractorId, w.A))!.availability).toBe("placed");
    expect(await getNeed(contractorId, needId)).toMatchObject({ countFilled: 1, status: "open" });
    expect(await moneySummary(contractorId)).toMatchObject({ toCollect: 900, toCollectCount: 1, atRisk: 0 });
  });

  it("shop pays -> worker sent, trial starts, money at risk", async () => {
    const [p] = await db.select().from(placements).where(eq(placements.workerId, w.A));
    expect(await applyPlacementAction(contractorId, p.id, "confirm")).toBe(false); // not before payment
    expect(await applyPlacementAction(contractorId, p.id, "paid")).toBe(true);
    const paid = (await getPlacement(contractorId, p.id))!;
    expect(paid).toMatchObject({ status: "trial", commissionStatus: "at_risk" });
    expect(paid.commissionReceivedAt).not.toBeNull();
    expect(await moneySummary(contractorId)).toMatchObject({ toCollect: 0, atRisk: 900 });
  });

  it("trial end makes the commission earned automatically", async () => {
    const [p] = await db.select().from(placements).where(eq(placements.workerId, w.A));
    await db.update(placements).set({ startDate: "2026-01-01" }).where(eq(placements.id, p.id));
    await advanceCommissions(contractorId);
    expect(await getPlacement(contractorId, p.id)).toMatchObject({ status: "confirmed", commissionStatus: "earned" });
    expect((await listPlacements(contractorId, "earned")).map((x) => x.id)).toContain(p.id);
  });

  it("shop cancels before paying: lost, worker free, slot reopens", async () => {
    const id = (await place(w.B))!;
    expect(await applyPlacementAction(contractorId, id, "cancel")).toBe(true);
    expect(await getPlacement(contractorId, id)).toMatchObject({ status: "cancelled", commissionStatus: "lost" });
    expect((await getWorker(contractorId, w.B))!.availability).toBe("available");
    expect((await getNeed(contractorId, needId))!.countFilled).toBe(1);
  });

  it("worker fails in trial -> replacement carries the paid commission", async () => {
    const id = (await place(w.B))!;
    await applyPlacementAction(contractorId, id, "paid");
    const newId = (await replacePlacement(contractorId, id, w.C))!;
    expect(newId).toBeTruthy();
    expect(await getPlacement(contractorId, id)).toMatchObject({ status: "failed", commissionStatus: "transferred" });
    const repl = (await getPlacement(contractorId, newId))!;
    expect(repl).toMatchObject({ status: "trial", commissionStatus: "at_risk", commissionAmount: 900, replacementFor: id });
    expect(repl.replaces?.workerName).toBe("B");
    expect((await getWorker(contractorId, w.B))!.availability).toBe("available");
    expect((await getWorker(contractorId, w.C))!.availability).toBe("placed");
    // The shop still has the same number of workers.
    expect((await getNeed(contractorId, needId))!.countFilled).toBe(2);
    // Can't replace with a worker who is already placed.
    expect(await replacePlacement(contractorId, newId, w.A)).toBeNull();
  });

  it("worker fails in trial -> refund: money back, need reopens", async () => {
    const [p] = await db.select().from(placements).where(eq(placements.workerId, w.C));
    expect(await applyPlacementAction(contractorId, p.id, "refund")).toBe(true);
    expect(await getPlacement(contractorId, p.id)).toMatchObject({ status: "failed", commissionStatus: "refunded" });
    expect((await getWorker(contractorId, w.C))!.availability).toBe("available");
    expect(await getNeed(contractorId, needId)).toMatchObject({ countFilled: 1, status: "open" });
  });

  it("rating and job end", async () => {
    const [p] = await db.select().from(placements).where(eq(placements.workerId, w.A));
    expect(await applyPlacementAction(contractorId, p.id, "end")).toBe(true);
    expect(await ratePlacement(contractorId, p.id, 5, "great")).toBe(true);
    expect((await getWorker(contractorId, w.A))!).toMatchObject({ availability: "available", rating: { avg: 5, count: 1 } });
    expect((await listPlacements(contractorId)).find((x) => x.id === p.id)?.rated).toBe(true);
  });

  it("another contractor cannot touch these placements", async () => {
    const [p] = await db.select().from(placements).where(eq(placements.workerId, w.A));
    expect(await getPlacement(otherId, p.id)).toBeNull();
    expect(await applyPlacementAction(otherId, p.id, "refund")).toBe(false);
    expect(await replacePlacement(otherId, p.id, w.D)).toBeNull();
    expect(await ratePlacement(otherId, p.id, 1, null)).toBe(false);
    expect(await createPlacement(otherId, { workerId: w.D, needId, startDate: today(), wage: 900, commissionAmount: 900, probationDays: 7 })).toBeNull();
  });
});
