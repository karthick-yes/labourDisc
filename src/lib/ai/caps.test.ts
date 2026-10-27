import { describe, expect, it } from "vitest";
import { tokenCost, transcriptionCost } from "@/config/ai-pricing";
import { checkCaps, type CapInput } from "./caps";

const base: CapInput = {
  enabled: true,
  estimateUsd: 0.004,
  monthSpentUsd: 0,
  monthlyCapUsd: 2,
  contractorTodayUsd: 0,
  dailyCapPerContractorUsd: 0.1,
  intakesToday: 0,
  maxIntakesPerDay: 5,
  contractorIntakesLastHour: 0,
  maxIntakesPerHourPerContractor: 3,
};

describe("checkCaps", () => {
  it("allows a call under every cap", () => {
    expect(checkCaps(base)).toEqual({ allowed: true });
  });

  it("kill switch blocks everything", () => {
    expect(checkCaps({ ...base, enabled: false })).toEqual({ allowed: false, reason: "disabled" });
  });

  it("blocks at and over the monthly cap, including when this call would cross it", () => {
    expect(checkCaps({ ...base, monthSpentUsd: 2 })).toMatchObject({ reason: "monthly_cap" });
    expect(checkCaps({ ...base, monthSpentUsd: 2.5 })).toMatchObject({ reason: "monthly_cap" });
    expect(checkCaps({ ...base, monthSpentUsd: 1.998 })).toMatchObject({ reason: "monthly_cap" });
    expect(checkCaps({ ...base, monthSpentUsd: 1.99 })).toEqual({ allowed: true });
  });

  it("blocks at the per-contractor daily cap", () => {
    expect(checkCaps({ ...base, contractorTodayUsd: 0.1 })).toMatchObject({ reason: "daily_contractor_cap" });
    expect(checkCaps({ ...base, contractorTodayUsd: 0.05 })).toEqual({ allowed: true });
  });

  it("blocks after the daily intake count (whole app) and hourly per-contractor rate", () => {
    expect(checkCaps({ ...base, intakesToday: 5 })).toMatchObject({ reason: "daily_intake_limit" });
    expect(checkCaps({ ...base, intakesToday: 4 })).toEqual({ allowed: true });
    expect(checkCaps({ ...base, contractorIntakesLastHour: 3 })).toMatchObject({ reason: "hourly_rate_limit" });
  });

  it("skips count limits when not starting a new intake", () => {
    const { maxIntakesPerDay: _a, maxIntakesPerHourPerContractor: _b, ...money } = base;
    expect(checkCaps({ ...money, intakesToday: 99, contractorIntakesLastHour: 99 })).toEqual({ allowed: true });
  });
});

describe("pricing", () => {
  it("estimates a 60s transcription and a typical extraction", () => {
    expect(transcriptionCost("gpt-4o-mini-transcribe", 60)).toBeCloseTo(0.003);
    expect(tokenCost("gpt-5-nano", 1_000_000, 0)).toBeCloseTo(0.05);
  });

  it("prices unknown models at the expensive fallback so estimates err high", () => {
    expect(transcriptionCost("some-new-model", 60)).toBeCloseTo(0.006);
  });
});
