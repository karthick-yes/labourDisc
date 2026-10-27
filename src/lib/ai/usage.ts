import "server-only";
import { and, count, eq, gte, sql, sum } from "drizzle-orm";
import { aiLimits } from "@/config/limits";
import { db } from "@/db";
import { aiUsage } from "@/db/schema";
import { checkCaps, type BlockReason } from "./caps";

// Spend tracking for OpenAI calls. Every call (allowed or blocked) gets an
// ai_usage row. Checks and reservations run under one advisory lock so two
// intakes at the same moment cannot both slip under a cap.

const TZ = "Asia/Kolkata";
const startOfToday = sql`date_trunc('day', now() at time zone ${TZ}) at time zone ${TZ}`;
const startOfMonth = sql`date_trunc('month', now() at time zone ${TZ}) at time zone ${TZ}`;
const AI_LOCK_KEY = 74_201;

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function snapshot(tx: Tx | typeof db, contractorId: string) {
  const spent = (where: ReturnType<typeof and>) =>
    tx.select({ v: sum(aiUsage.estCostUsd) }).from(aiUsage).where(where);
  const [[month], [today], [intakes], [hourly]] = await Promise.all([
    spent(and(eq(aiUsage.allowed, true), gte(aiUsage.createdAt, startOfMonth))),
    spent(and(eq(aiUsage.allowed, true), eq(aiUsage.contractorId, contractorId), gte(aiUsage.createdAt, startOfToday))),
    tx
      .select({ n: count() })
      .from(aiUsage)
      .where(and(eq(aiUsage.allowed, true), eq(aiUsage.kind, "transcribe"), gte(aiUsage.createdAt, startOfToday))),
    tx
      .select({ n: count() })
      .from(aiUsage)
      .where(
        and(
          eq(aiUsage.allowed, true),
          eq(aiUsage.kind, "transcribe"),
          eq(aiUsage.contractorId, contractorId),
          gte(aiUsage.createdAt, sql`now() - interval '1 hour'`),
        ),
      ),
  ]);
  return {
    monthSpentUsd: Number(month.v ?? 0),
    contractorTodayUsd: Number(today.v ?? 0),
    intakesToday: intakes.n,
    contractorIntakesLastHour: hourly.n,
  };
}

export type Reservation = { ok: true; id: string } | { ok: false; reason: BlockReason };

/**
 * Checks caps and, if allowed, records the call up front at its estimated
 * cost. `newIntake` applies the intake count limits (first call of an intake).
 */
export async function reserveAiCall(opts: {
  contractorId: string;
  kind: "transcribe" | "extract";
  model: string;
  estimateUsd: number;
  newIntake: boolean;
}): Promise<Reservation> {
  const limits = aiLimits();
  const configured = Boolean(process.env.OPENAI_API_KEY);
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${AI_LOCK_KEY})`);
    const snap = await snapshot(tx, opts.contractorId);
    const decision = !configured
      ? ({ allowed: false, reason: "not_configured" } as const)
      : checkCaps({
          enabled: limits.enabled,
          estimateUsd: opts.estimateUsd,
          monthSpentUsd: snap.monthSpentUsd,
          monthlyCapUsd: limits.monthlyCapUsd,
          contractorTodayUsd: snap.contractorTodayUsd,
          dailyCapPerContractorUsd: limits.dailyCapPerContractorUsd,
          ...(opts.newIntake
            ? {
                intakesToday: snap.intakesToday,
                maxIntakesPerDay: limits.maxIntakesPerDay,
                contractorIntakesLastHour: snap.contractorIntakesLastHour,
                maxIntakesPerHourPerContractor: limits.maxIntakesPerHourPerContractor,
              }
            : {}),
        });
    const [row] = await tx
      .insert(aiUsage)
      .values({
        contractorId: opts.contractorId,
        kind: opts.kind,
        model: opts.model,
        estCostUsd: decision.allowed ? opts.estimateUsd : 0,
        allowed: decision.allowed,
        blockedReason: decision.allowed ? null : decision.reason,
      })
      .returning({ id: aiUsage.id });
    return decision.allowed ? { ok: true, id: row.id } : { ok: false, reason: decision.reason };
  });
}

/**
 * The call failed (network/OpenAI error): it isn't billed, so it must not use
 * up the budget or the daily intake count.
 */
export async function releaseAiCall(id: string) {
  await db.update(aiUsage).set({ allowed: false, blockedReason: "ai_error", estCostUsd: 0 }).where(eq(aiUsage.id, id));
}

/** Replaces the reserved estimate with what the call actually used. */
export async function settleAiCall(
  id: string,
  actual: { costUsd: number; audioSeconds?: number; inputTokens?: number; outputTokens?: number },
) {
  await db
    .update(aiUsage)
    .set({
      estCostUsd: actual.costUsd,
      audioSeconds: actual.audioSeconds,
      inputTokens: actual.inputTokens,
      outputTokens: actual.outputTokens,
    })
    .where(eq(aiUsage.id, id));
}

/** Whether voice intake can be offered right now (for the UI). */
export async function aiStatus(contractorId: string) {
  const limits = aiLimits();
  if (!process.env.OPENAI_API_KEY) return { available: false as const, reason: "not_configured" as BlockReason };
  const snap = await snapshot(db, contractorId);
  const decision = checkCaps({
    enabled: limits.enabled,
    estimateUsd: 0.005,
    monthSpentUsd: snap.monthSpentUsd,
    monthlyCapUsd: limits.monthlyCapUsd,
    contractorTodayUsd: snap.contractorTodayUsd,
    dailyCapPerContractorUsd: limits.dailyCapPerContractorUsd,
    intakesToday: snap.intakesToday,
    maxIntakesPerDay: limits.maxIntakesPerDay,
    contractorIntakesLastHour: snap.contractorIntakesLastHour,
    maxIntakesPerHourPerContractor: limits.maxIntakesPerHourPerContractor,
  });
  const remainingToday = Math.max(0, limits.maxIntakesPerDay - snap.intakesToday);
  return decision.allowed
    ? { available: true as const, remainingToday }
    : { available: false as const, reason: decision.reason };
}

/** Numbers for the /admin page. */
export async function usageReport() {
  const [month] = await db
    .select({ spent: sum(aiUsage.estCostUsd), calls: count() })
    .from(aiUsage)
    .where(and(eq(aiUsage.allowed, true), gte(aiUsage.createdAt, startOfMonth)));
  const [blocked] = await db
    .select({ n: count() })
    .from(aiUsage)
    .where(and(eq(aiUsage.allowed, false), gte(aiUsage.createdAt, startOfMonth)));
  const [today] = await db
    .select({ intakes: count() })
    .from(aiUsage)
    .where(and(eq(aiUsage.allowed, true), eq(aiUsage.kind, "transcribe"), gte(aiUsage.createdAt, startOfToday)));
  const perContractor = await db.execute<{ name: string | null; phone: string | null; spent: number; calls: number }>(sql`
    select c.name, c.phone, coalesce(sum(u.est_cost_usd), 0)::float as spent, count(u.id)::int as calls
    from ai_usage u left join contractors c on c.id = u.contractor_id
    where u.allowed and u.created_at >= ${startOfMonth}
    group by c.name, c.phone order by spent desc limit 50`);
  return {
    monthSpentUsd: Number(month.spent ?? 0),
    monthCalls: month.calls,
    monthBlocked: blocked.n,
    intakesToday: today.intakes,
    perContractor: [...perContractor],
  };
}
