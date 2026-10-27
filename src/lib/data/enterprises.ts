import "server-only";
import { and, asc, count, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { enterprises } from "@/db/schema";

export type EnterpriseInput = {
  name: string;
  phone: string | null;
  categoryId: string | null;
  lat: number | null;
  lng: number | null;
  areaName: string | null;
  notes: string | null;
};

// Columns are written out qualified: in a single-table select Drizzle renders
// bare names, and inside the subquery "id" would then mean needs.id.
const openNeedsCount = sql<number>`(
  select count(*)::int from "needs" n
  where n."enterprise_id" = "enterprises"."id" and n."status" = 'open'
)`;

export async function listEnterprises(
  contractorId: string,
  opts: { q?: string; categoryId?: string; withOpenNeeds?: boolean; limit?: number } = {},
) {
  const filters: (SQL | undefined)[] = [eq(enterprises.contractorId, contractorId)];
  const q = opts.q?.trim();
  if (q) filters.push(or(ilike(enterprises.name, `%${q}%`), ilike(enterprises.areaName, `%${q}%`)));
  if (opts.categoryId) filters.push(eq(enterprises.categoryId, opts.categoryId));
  if (opts.withOpenNeeds) filters.push(sql`${openNeedsCount} > 0`);

  return db
    .select({
      id: enterprises.id,
      name: enterprises.name,
      phone: enterprises.phone,
      categoryId: enterprises.categoryId,
      lat: enterprises.lat,
      lng: enterprises.lng,
      areaName: enterprises.areaName,
      source: enterprises.source,
      isDemo: enterprises.isDemo,
      openNeeds: openNeedsCount,
    })
    .from(enterprises)
    .where(and(...filters))
    .orderBy(sql`${openNeedsCount} desc`, asc(enterprises.name))
    .limit(opts.limit ?? 300);
}

export type EnterpriseListItem = Awaited<ReturnType<typeof listEnterprises>>[number];

export async function countEnterprises(contractorId: string) {
  const [row] = await db
    .select({ n: count() })
    .from(enterprises)
    .where(eq(enterprises.contractorId, contractorId));
  return row.n;
}

export async function getEnterprise(contractorId: string, id: string) {
  const [row] = await db
    .select()
    .from(enterprises)
    .where(and(eq(enterprises.contractorId, contractorId), eq(enterprises.id, id)))
    .limit(1);
  return row ?? null;
}

export type Enterprise = NonNullable<Awaited<ReturnType<typeof getEnterprise>>>;

export async function createEnterprise(contractorId: string, input: EnterpriseInput) {
  const [created] = await db
    .insert(enterprises)
    .values({ ...input, contractorId, source: "manual" })
    .returning({ id: enterprises.id });
  return created.id;
}

export async function updateEnterprise(contractorId: string, id: string, input: EnterpriseInput) {
  const rows = await db
    .update(enterprises)
    .set(input)
    .where(and(eq(enterprises.contractorId, contractorId), eq(enterprises.id, id)))
    .returning({ id: enterprises.id });
  return rows.length > 0;
}

export async function deleteEnterprise(contractorId: string, id: string) {
  await db
    .delete(enterprises)
    .where(and(eq(enterprises.contractorId, contractorId), eq(enterprises.id, id)));
}
