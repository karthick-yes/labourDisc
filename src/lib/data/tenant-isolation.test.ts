// Integration test (needs DATABASE_URL): one contractor must never read or
// change another contractor's data (brief §8).
import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/db";
import { contractors } from "@/db/schema";
import { createEnterprise, getEnterprise, listEnterprises, updateEnterprise } from "./enterprises";
import { matchesForNeed, matchesForWorker } from "./matching";
import { createNeed, getNeed, listNeeds } from "./needs";
import { createWorker, deleteWorker, getWorker, listWorkers, updateWorker } from "./workers";

const phones = ["910000000001", "910000000002"];
let a: typeof contractors.$inferSelect;
let b: typeof contractors.$inferSelect;
let aWorker: string;
let aEnterprise: string;
let aNeed: string;

const asCurrent = (c: typeof contractors.$inferSelect) => ({
  id: c.id,
  name: c.name,
  phone: c.phone,
  baseLat: c.baseLat,
  baseLng: c.baseLng,
  areaName: c.areaName,
  defaultProbationDays: c.defaultProbationDays,
});

beforeAll(async () => {
  await db.delete(contractors).where(inArray(contractors.phone, phones));
  [a, b] = await db
    .insert(contractors)
    .values(phones.map((phone, i) => ({ name: `Tenant ${i}`, phone, pinHash: "x", baseLat: 10.1, baseLng: 76.47 })))
    .returning();

  aWorker = await createWorker(a.id, {
    name: "A's welder",
    homeState: "Assam",
    languages: ["Hindi"],
    expectedWage: 1000,
    availability: "available",
    notes: null,
    mediaConsent: true,
    skills: [{ skillId: "welder", years: 3 }],
  });
  aEnterprise = await createEnterprise(a.id, {
    name: "A's workshop",
    phone: null,
    categoryId: "workshop",
    lat: 10.1,
    lng: 76.47,
    areaName: null,
    notes: null,
  });
  aNeed = (await createNeed(a.id, {
    enterpriseId: aEnterprise,
    skillId: "welder",
    countNeeded: 1,
    wageOffered: 1200,
    startDate: null,
    notes: null,
  }))!;
});

afterAll(async () => {
  await db.delete(contractors).where(inArray(contractors.phone, phones));
});

describe("tenant isolation", () => {
  it("owner sees their own records", async () => {
    expect(await getWorker(a.id, aWorker)).not.toBeNull();
    expect(await getEnterprise(a.id, aEnterprise)).not.toBeNull();
    expect(await getNeed(a.id, aNeed)).not.toBeNull();
    const worker = (await getWorker(a.id, aWorker))!;
    expect((await matchesForWorker(asCurrent(a), worker)).map((m) => m.needId)).toContain(aNeed);
    // Regression: the correlated open-needs count must see this shop's need.
    expect((await listEnterprises(a.id))[0].openNeeds).toBe(1);
    expect(await listEnterprises(a.id, { withOpenNeeds: true })).toHaveLength(1);
  });

  it("another contractor cannot read them by id", async () => {
    expect(await getWorker(b.id, aWorker)).toBeNull();
    expect(await getEnterprise(b.id, aEnterprise)).toBeNull();
    expect(await getNeed(b.id, aNeed)).toBeNull();
  });

  it("another contractor's lists, search and matches are empty", async () => {
    expect(await listWorkers(b.id)).toHaveLength(0);
    expect(await listWorkers(b.id, { q: "welder" })).toHaveLength(0);
    expect(await listEnterprises(b.id)).toHaveLength(0);
    expect(await listNeeds(b.id)).toHaveLength(0);
    const need = (await getNeed(a.id, aNeed))!;
    expect(await matchesForNeed(asCurrent(b), need)).toHaveLength(0);
  });

  it("another contractor cannot change or delete them", async () => {
    const changed = await updateWorker(b.id, aWorker, {
      name: "hijacked",
      homeState: null,
      languages: [],
      expectedWage: null,
      availability: "inactive",
      notes: null,
      mediaConsent: false,
      skills: [{ skillId: "helper", years: null }],
    });
    expect(changed).toBe(false);
    expect(await updateEnterprise(b.id, aEnterprise, { name: "hijacked", phone: null, categoryId: null, lat: null, lng: null, areaName: null, notes: null })).toBe(false);
    expect(await deleteWorker(b.id, aWorker)).toBeNull();
    expect((await getWorker(a.id, aWorker))!.name).toBe("A's welder");
  });

  it("cannot attach a need to another contractor's enterprise", async () => {
    const id = await createNeed(b.id, {
      enterpriseId: aEnterprise,
      skillId: "helper",
      countNeeded: 1,
      wageOffered: null,
      startDate: null,
      notes: null,
    });
    expect(id).toBeNull();
  });

  it("deleting a contractor removes all their data", async () => {
    await db.delete(contractors).where(eq(contractors.id, a.id));
    expect(await getWorker(a.id, aWorker)).toBeNull();
    expect(await getEnterprise(a.id, aEnterprise)).toBeNull();
  });
});

describe("public media", () => {
  it("serves a consented worker's photo and video only while the link is live", async () => {
    const { isPublicMedia, setWorkerVideo, setShareToken } = await import("./workers");
    const id = await createWorker(b.id, {
      name: "Media",
      homeState: null,
      languages: [],
      expectedWage: null,
      availability: "available",
      notes: null,
      mediaConsent: true,
      skills: [{ skillId: "helper", years: null }],
      photoUrl: "/api/media/x/photo.jpg",
    } as Parameters<typeof createWorker>[1]);
    await setWorkerVideo(b.id, id, "/api/media/x/video.mp4");
    expect(await isPublicMedia("/api/media/x/photo.jpg")).toBe(true);
    expect(await isPublicMedia("/api/media/x/video.mp4")).toBe(true);
    expect(await isPublicMedia("/api/media/x/other.mp4")).toBe(false);
    await setShareToken(b.id, id, null);
    expect(await isPublicMedia("/api/media/x/video.mp4")).toBe(false);
  });
});
