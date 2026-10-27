// Usage limits. Deliberately tight: the OpenAI credit is shared with another
// project, and Overpass/Nominatim are free public services. Every value can be
// raised with an env var once usage is understood.

const num = (name: string, fallback: number) => {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && process.env[name] !== "" && process.env[name] != null ? v : fallback;
};

export function aiLimits() {
  return {
    enabled: process.env.AI_ENABLED === "true", // off unless explicitly turned on
    monthlyCapUsd: num("AI_MONTHLY_CAP_USD", 2),
    dailyCapPerContractorUsd: num("AI_DAILY_CAP_PER_CONTRACTOR_USD", 0.1),
    // One voice intake = one transcription + one extraction call.
    maxIntakesPerDay: num("AI_MAX_INTAKES_PER_DAY", 5), // whole app
    maxIntakesPerHourPerContractor: num("AI_MAX_INTAKES_PER_HOUR_PER_CONTRACTOR", 3),
  };
}

export const VOICE_MAX_SECONDS = 60;
// 60 s of Opus is ~250 KB; iPhone Safari records AAC and may ignore the
// requested bitrate (~1 MB+). Cost depends on seconds, not bytes.
export const VOICE_MAX_BYTES = 3_000_000;
export const VIDEO_MAX_SECONDS = 20;
// iPhone 20 s clips at default quality are ~15–25 MB.
export const VIDEO_MAX_BYTES = 25 * 1024 * 1024;

export function externalLimits() {
  return {
    // Live Overpass searches (place lookups by location).
    overpassPerContractorPerDay: num("OVERPASS_PER_CONTRACTOR_PER_DAY", 10),
    overpassPerDay: num("OVERPASS_PER_DAY", 40),
    // Place-name lookups (Nominatim). Its policy allows at most 1 request/second.
    nominatimPerContractorPerDay: num("NOMINATIM_PER_CONTRACTOR_PER_DAY", 20),
    nominatimPerDay: num("NOMINATIM_PER_DAY", 100),
  };
}

/** Cached place searches are reused for this long. */
export const PLACE_CACHE_DAYS = 14;
