// Matching rules (brief §7). Tune here, not in code.

export const MATCH_WEIGHTS = {
  skill: { exact: 50, related: 20 },
  // Distance from the enterprise to the contractor's base.
  distance: [
    { maxKm: 5, points: 20 },
    { maxKm: 15, points: 12 },
    { maxKm: 30, points: 5 },
  ],
  wage: {
    withinOffer: 15, // expected <= offered
    nearPct: 10, // expected up to this % above offered...
    near: 8, // ...scores this
    unknown: 8, // either wage missing
  },
  rating: { perStar: 2, none: 5 }, // avg rating × 2; unrated = neutral 5
  experience: { perYear: 1, max: 5 },
} as const;

export const MATCH_LABELS = { strong: 75, good: 50 } as const;

// Worker skills that partly qualify for a need's skill (need skill -> worker
// skills). "helper" counts as related to every role.
export const RELATED_SKILLS: Record<string, string[]> = {
  welder: ["fitter"],
  fitter: ["welder"],
  cook: ["kitchen_helper", "baker"],
  kitchen_helper: ["cook", "cleaner"],
  baker: ["cook", "kitchen_helper"],
  juice_maker: ["kitchen_helper", "waiter"],
  waiter: ["kitchen_helper", "cleaner"],
  machine_operator: ["plywood_press_operator"],
  plywood_press_operator: ["machine_operator"],
  roofing_worker: ["welder", "carpenter"],
  mason: ["painter"],
  painter: ["mason"],
  carpenter: ["roofing_worker"],
  loader: ["driver"],
};
export const UNIVERSAL_RELATED_SKILL = "helper";

// Max results shown in a match list.
export const MATCH_LIST_LIMIT = 20;
