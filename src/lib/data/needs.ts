import "server-only";
import { and, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { enterprises, needs } from "@/db/schema";
import { getSkills, skillIdsMatching } from "./reference";

export type NeedStatus = (typeof needs.$inferSelect)["status"];

export type NeedInput = {
  enterpriseId: string;
  skillId: string;
  countNeeded: number;
  wageOffered: number | null;
  startDate: string | null; // YYYY-MM-DD
  notes: string | null;
};

const needColumns = {
  id: needs.id,
  enterpriseId: needs.enterpriseId,
  skillId: needs.skillId,
  countNeeded: needs.countNeeded,
  countFilled: needs.countFilled,
  wageOffered: needs.wageOffered,
  startDate: needs.startDate,
  status: needs.status,
  notes: needs.notes,
  isDemo: needs.isDemo,
  createdAt: needs.createdAt,
  enterpriseName: enterprises.name,
  enterprisePhone: enterprises.phone,
  enterpriseCategoryId: enterprises.categoryId,
  enterpriseArea: enterprises.areaName,
  enterpriseLat: enterprises.lat,
  enterpriseLng: enterprises.lng,
  enterpriseIsDemo: enterprises.isDemo,
};

export async function listNeeds(
  contractorId: string,
  opts: { status?: NeedStatus; q?: string; enterpriseId?: string; limit?: number } = {},
) {
  const filters: (SQL | undefined)[] = [eq(needs.contractorId, contractorId)];
  if (opts.status) filters.push(eq(needs.status, opts.status));
  if (opts.enterpriseId) filters.push(eq(needs.enterpriseId, opts.enterpriseId));
  const q = opts.q?.trim();
  if (q) {
    const skillIds = skillIdsMatching(await getSkills(), q);
    filters.push(
      or(
        ilike(enterprises.name, `%${q}%`),
        ilike(enterprises.areaName, `%${q}%`),
        skillIds.length ? inArray(needs.skillId, skillIds) : undefined,
      ),
    );
  }
  return db
    .select(needColumns)
    .from(needs)
    .innerJoin(enterprises, eq(enterprises.id, needs.enterpriseId))
    .where(and(...filters))
    .orderBy(sql`${needs.status} = 'open' desc`, desc(needs.createdAt))
    .limit(opts.limit ?? 200);
}

export type NeedListItem = Awaited<ReturnType<typeof listNeeds>>[number];

export async function getNeed(contractorId: string, id: string) {
  const [row] = await db
    .select(needColumns)
    .from(needs)
    .innerJoin(enterprises, eq(enterprises.id, needs.enterpriseId))
    .where(and(eq(needs.contractorId, contractorId), eq(needs.id, id)))
    .limit(1);
  return row ?? null;
}

export type NeedDetail = NonNullable<Awaited<ReturnType<typeof getNeed>>>;

async function ownsEnterprise(contractorId: string, enterpriseId: string) {
  const [row] = await db
    .select({ id: enterprises.id })
    .from(enterprises)
    .where(and(eq(enterprises.contractorId, contractorId), eq(enterprises.id, enterpriseId)))
    .limit(1);
  return Boolean(row);
}

export async function createNeed(contractorId: string, input: NeedInput) {
  if (!(await ownsEnterprise(contractorId, input.enterpriseId))) return null;
  const [created] = await db
    .insert(needs)
    .values({ ...input, contractorId })
    .returning({ id: needs.id });
  return created.id;
}

export async function updateNeed(contractorId: string, id: string, input: NeedInput) {
  if (!(await ownsEnterprise(contractorId, input.enterpriseId))) return false;
  const rows = await db
    .update(needs)
    .set(input)
    .where(and(eq(needs.contractorId, contractorId), eq(needs.id, id)))
    .returning({ id: needs.id });
  return rows.length > 0;
}

export async function setNeedStatus(contractorId: string, id: string, status: NeedStatus) {
  await db
    .update(needs)
    .set({ status })
    .where(and(eq(needs.contractorId, contractorId), eq(needs.id, id)));
}

export async function deleteNeed(contractorId: string, id: string) {
  await db.delete(needs).where(and(eq(needs.contractorId, contractorId), eq(needs.id, id)));
}
