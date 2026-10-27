// App-wide defaults and business rules. Matching weights, OSM filters and AI
// pricing get their own config files in later milestones.

export const LOCALES = ["ml", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ml";
export const LOCALE_COOKIE = "locale";

export const SESSION_COOKIE = "pb_session";
export const SESSION_DAYS = 30;

export const PIN_MIN_LENGTH = 4;
export const PIN_MAX_LENGTH = 6;
export const PIN_MAX_ATTEMPTS = 5;
export const PIN_LOCK_MINUTES = 15;

export const DEFAULT_PROBATION_DAYS = 7;
// Home screen shows trial placements whose probation ends within this many days.
export const TRIAL_ENDING_SOON_DAYS = 3;

export const DEFAULT_COUNTRY_CODE = "91";
