import { describe, expect, it } from "vitest";
import {
  distancePoints,
  labelFor,
  ratingPoints,
  scoreMatch,
  wagePoints,
  type ScoreInput,
} from "./score";

const input = (over: {
  need?: Partial<ScoreInput["need"]>;
  worker?: Partial<ScoreInput["worker"]>;
}): ScoreInput => ({
  need: { skillId: "welder", wageOffered: 1200, distanceKm: 3, ...over.need },
  worker: {
    skills: [{ skillId: "welder", years: 5 }],
    expectedWage: 1200,
    avgRating: null,
    ...over.worker,
  },
});

describe("scoreMatch", () => {
  it("demo case: nearby welder, 5 yrs, wage fits -> Strong 95", () => {
    const r = scoreMatch(input({}))!;
    // 50 skill + 20 distance + 15 wage + 5 unrated + 5 experience
    expect(r.score).toBe(95);
    expect(r.label).toBe("strong");
    expect(r.skillMatch).toBe("exact");
  });

  it("excludes workers with no matching or related skill", () => {
    expect(scoreMatch(input({ worker: { skills: [{ skillId: "cook", years: 3 }] } }))).toBeNull();
    expect(scoreMatch(input({ worker: { skills: [] } }))).toBeNull();
  });

  it("treats helper as related to any role", () => {
    const r = scoreMatch(input({ worker: { skills: [{ skillId: "helper", years: 2 }] } }))!;
    expect(r.skillMatch).toBe("related");
    expect(r.points.skill).toBe(20);
    expect(r.matchedSkillId).toBe("helper");
  });

  it("uses configured related skills (fitter for welder)", () => {
    const r = scoreMatch(input({ worker: { skills: [{ skillId: "fitter", years: 1 }] } }))!;
    expect(r.skillMatch).toBe("related");
  });

  it("prefers the exact skill when the worker has both", () => {
    const r = scoreMatch(
      input({ worker: { skills: [{ skillId: "helper", years: 9 }, { skillId: "welder", years: 2 }] } }),
    )!;
    expect(r.skillMatch).toBe("exact");
    expect(r.years).toBe(2);
  });

  it("caps experience points at 5", () => {
    expect(scoreMatch(input({ worker: { skills: [{ skillId: "welder", years: 20 }] } }))!.points.experience).toBe(5);
    expect(scoreMatch(input({ worker: { skills: [{ skillId: "welder", years: null }] } }))!.points.experience).toBe(0);
  });

  it("labels Good and Possible", () => {
    // related (20) + far (0) + wage too high (0) + rating 5 + exp 0 = 25
    const weak = scoreMatch(
      input({
        need: { distanceKm: 50, wageOffered: 800 },
        worker: { skills: [{ skillId: "helper", years: 0 }], expectedWage: 1000 },
      }),
    )!;
    expect(weak.score).toBe(25);
    expect(weak.label).toBe("possible");
    // exact 50 + 15km (12) + near wage (8) + unrated 5 + 0 = 75 -> strong boundary
    expect(labelFor(75)).toBe("strong");
    expect(labelFor(74)).toBe("good");
    expect(labelFor(50)).toBe("good");
    expect(labelFor(49)).toBe("possible");
  });
});

describe("component scores", () => {
  it("distance buckets", () => {
    expect(distancePoints(0)).toBe(20);
    expect(distancePoints(5)).toBe(20);
    expect(distancePoints(5.1)).toBe(12);
    expect(distancePoints(15)).toBe(12);
    expect(distancePoints(30)).toBe(5);
    expect(distancePoints(31)).toBe(0);
    expect(distancePoints(null)).toBe(0);
  });

  it("wage fit", () => {
    expect(wagePoints(1000, 1000)).toBe(15);
    expect(wagePoints(1100, 1000)).toBe(8); // exactly 10% above
    expect(wagePoints(1101, 1000)).toBe(0);
    expect(wagePoints(null, 1000)).toBe(8);
    expect(wagePoints(1000, null)).toBe(8);
  });

  it("rating", () => {
    expect(ratingPoints(null)).toBe(5);
    expect(ratingPoints(5)).toBe(10);
    expect(ratingPoints(3.5)).toBe(7);
  });
});
