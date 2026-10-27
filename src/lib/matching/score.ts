import {
  MATCH_LABELS,
  MATCH_WEIGHTS as W,
  RELATED_SKILLS,
  UNIVERSAL_RELATED_SKILL,
} from "@/config/matching";

export type MatchLabel = "strong" | "good" | "possible";

export type ScoreInput = {
  need: { skillId: string; wageOffered: number | null; distanceKm: number | null };
  worker: {
    skills: { skillId: string; years: number | null }[];
    expectedWage: number | null;
    avgRating: number | null;
  };
};

export type ScoreResult = {
  score: number;
  label: MatchLabel;
  skillMatch: "exact" | "related";
  matchedSkillId: string;
  years: number | null;
  points: { skill: number; distance: number; wage: number; rating: number; experience: number };
};

export function isRelatedSkill(needSkillId: string, workerSkillId: string): boolean {
  return (
    workerSkillId === UNIVERSAL_RELATED_SKILL ||
    (RELATED_SKILLS[needSkillId] ?? []).includes(workerSkillId)
  );
}

export function distancePoints(km: number | null): number {
  if (km == null) return 0;
  return W.distance.find((b) => km <= b.maxKm)?.points ?? 0;
}

export function wagePoints(expected: number | null, offered: number | null): number {
  if (expected == null || offered == null) return W.wage.unknown;
  if (expected <= offered) return W.wage.withinOffer;
  if (expected <= offered * (1 + W.wage.nearPct / 100)) return W.wage.near;
  return 0;
}

export function ratingPoints(avg: number | null): number {
  return avg == null ? W.rating.none : avg * W.rating.perStar;
}

export function labelFor(score: number): MatchLabel {
  if (score >= MATCH_LABELS.strong) return "strong";
  if (score >= MATCH_LABELS.good) return "good";
  return "possible";
}

/** Scores a worker against a need, 0–100. Returns null if skills don't fit. */
export function scoreMatch({ need, worker }: ScoreInput): ScoreResult | null {
  const exact = worker.skills.find((s) => s.skillId === need.skillId);
  const related = exact ? undefined : worker.skills.find((s) => isRelatedSkill(need.skillId, s.skillId));
  const matched = exact ?? related;
  if (!matched) return null;

  const points = {
    skill: exact ? W.skill.exact : W.skill.related,
    distance: distancePoints(need.distanceKm),
    wage: wagePoints(worker.expectedWage, need.wageOffered),
    rating: ratingPoints(worker.avgRating),
    experience: Math.min(W.experience.max, Math.max(0, (matched.years ?? 0) * W.experience.perYear)),
  };
  const score = Math.round(
    points.skill + points.distance + points.wage + points.rating + points.experience,
  );

  return {
    score,
    label: labelFor(score),
    skillMatch: exact ? "exact" : "related",
    matchedSkillId: matched.skillId,
    years: matched.years,
    points,
  };
}
