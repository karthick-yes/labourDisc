import "server-only";
import { and, count, eq, sql } from "drizzle-orm";
import { TRIAL_ENDING_SOON_DAYS } from "@/config/app";
import { db } from "@/db";
import { needs, placements, workers } from "@/db/schema";

export type HomeStats = {
  openNeeds: number;
  availableWorkers: number;
  trialsEndingSoon: number;
};

export async function getHomeStats(contractorId: string): Promise<HomeStats> {
  const [[openNeeds], [availableWorkers], [trials]] = await Promise.all([
    db
      .select({ n: count() })
      .from(needs)
      .where(and(eq(needs.contractorId, contractorId), eq(needs.status, "open"))),
    db
      .select({ n: count() })
      .from(workers)
      .where(and(eq(workers.contractorId, contractorId), eq(workers.availability, "available"))),
    db
      .select({ n: count() })
      .from(placements)
      .where(
        and(
          eq(placements.contractorId, contractorId),
          eq(placements.status, "trial"),
          sql`${placements.startDate} + ${placements.probationDays} <= current_date + ${TRIAL_ENDING_SOON_DAYS}::int`,
        ),
      ),
  ]);

  return {
    openNeeds: openNeeds.n,
    availableWorkers: availableWorkers.n,
    trialsEndingSoon: trials.n,
  };
}
