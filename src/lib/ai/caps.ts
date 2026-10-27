// Pure spending-cap decision, checked before every OpenAI call (brief §5a).

export type CapInput = {
  enabled: boolean;
  estimateUsd: number;
  monthSpentUsd: number;
  monthlyCapUsd: number;
  contractorTodayUsd: number;
  dailyCapPerContractorUsd: number;
  // Only checked when starting a new intake (not for the 2nd call of one).
  intakesToday?: number;
  maxIntakesPerDay?: number;
  contractorIntakesLastHour?: number;
  maxIntakesPerHourPerContractor?: number;
};

export type BlockReason =
  | "disabled"
  | "monthly_cap"
  | "daily_contractor_cap"
  | "daily_intake_limit"
  | "hourly_rate_limit"
  | "not_configured";

export type CapDecision = { allowed: true } | { allowed: false; reason: BlockReason };

export function checkCaps(c: CapInput): CapDecision {
  if (!c.enabled) return { allowed: false, reason: "disabled" };
  if (c.maxIntakesPerDay != null && (c.intakesToday ?? 0) >= c.maxIntakesPerDay) {
    return { allowed: false, reason: "daily_intake_limit" };
  }
  if (
    c.maxIntakesPerHourPerContractor != null &&
    (c.contractorIntakesLastHour ?? 0) >= c.maxIntakesPerHourPerContractor
  ) {
    return { allowed: false, reason: "hourly_rate_limit" };
  }
  // A call is blocked if it *would* take spend past a cap, not only once over.
  if (c.monthSpentUsd + c.estimateUsd > c.monthlyCapUsd) return { allowed: false, reason: "monthly_cap" };
  if (c.contractorTodayUsd + c.estimateUsd > c.dailyCapPerContractorUsd) {
    return { allowed: false, reason: "daily_contractor_cap" };
  }
  return { allowed: true };
}
