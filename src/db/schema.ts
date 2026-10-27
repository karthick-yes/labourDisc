import {
  type AnyPgColumn,
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const id = () => uuid("id").primaryKey().defaultRandom();
const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const contractorId = () =>
  uuid("contractor_id")
    .notNull()
    .references(() => contractors.id, { onDelete: "cascade" });

export const availabilityEnum = pgEnum("availability", [
  "available",
  "placed",
  "inactive",
]);
export const mediaTypeEnum = pgEnum("media_type", ["photo", "video"]);
export const enterpriseSourceEnum = pgEnum("enterprise_source", [
  "manual",
  "osm",
  "google",
]);
export const needStatusEnum = pgEnum("need_status", [
  "open",
  "filled",
  "cancelled",
]);
export const placementStatusEnum = pgEnum("placement_status", [
  "awaiting_payment", // worker reserved; shop hasn't paid the commission yet
  "trial", // paid, worker sent; guarantee period running
  "confirmed",
  "ended",
  "failed",
  "cancelled", // shop backed out before paying
]);
// The shop pays upfront, before workers are sent. During the trial the
// commission is at risk (refund or replacement if the worker fails).
export const commissionStateEnum = pgEnum("commission_state", [
  "unpaid",
  "at_risk",
  "earned",
  "refunded",
  "transferred", // moved to a replacement worker's placement
  "lost", // never paid
]);
export const aiKindEnum = pgEnum("ai_kind", ["transcribe", "extract"]);
export const externalServiceEnum = pgEnum("external_service", ["overpass", "nominatim"]);

// ---------- Seed tables (shared, not tenant data) ----------

export const skills = pgTable("skills", {
  id: text("id").primaryKey(), // slug, e.g. "welder"
  canonicalNameEn: text("canonical_name_en").notNull(),
  nameMl: text("name_ml").notNull(),
  synonyms: text("synonyms").array().notNull().default([]),
});

export const categories = pgTable("categories", {
  id: text("id").primaryKey(), // slug, e.g. "bakery"
  nameEn: text("name_en").notNull(),
  nameMl: text("name_ml").notNull(),
  osmTags: text("osm_tags").array().notNull().default([]),
});

export const categoryRoles = pgTable(
  "category_roles",
  {
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    skillId: text("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.categoryId, t.skillId] })],
);

// ---------- Tenants ----------

export const contractors = pgTable("contractors", {
  id: id(),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(), // digits with country code, e.g. 919876543210
  pinHash: text("pin_hash").notNull(),
  baseLat: doublePrecision("base_lat"),
  baseLng: doublePrecision("base_lng"),
  areaName: text("area_name"),
  defaultProbationDays: integer("default_probation_days").notNull().default(7),
  failedPinAttempts: integer("failed_pin_attempts").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  createdAt: createdAt(),
});

export const sessions = pgTable(
  "sessions",
  {
    // sha256 of the cookie token; the raw token is never stored
    id: text("id").primaryKey(),
    contractorId: contractorId(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("sessions_contractor_idx").on(t.contractorId)],
);

// ---------- Tenant data (every row carries contractor_id) ----------

export const workers = pgTable(
  "workers",
  {
    id: id(),
    contractorId: contractorId(),
    name: text("name").notNull(),
    photoUrl: text("photo_url"),
    homeState: text("home_state"),
    languages: text("languages").array().notNull().default([]),
    expectedWage: integer("expected_wage"), // ₹ per day
    availability: availabilityEnum("availability").notNull().default("available"),
    notes: text("notes"),
    voiceNoteUrl: text("voice_note_url"),
    transcript: text("transcript"),
    mediaConsent: boolean("media_consent").notNull().default(false),
    shareToken: text("share_token").unique(), // null = no public page / revoked
    isDemo: boolean("is_demo").notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [index("workers_contractor_idx").on(t.contractorId, t.availability)],
);

export const workerSkills = pgTable(
  "worker_skills",
  {
    workerId: uuid("worker_id")
      .notNull()
      .references(() => workers.id, { onDelete: "cascade" }),
    skillId: text("skill_id")
      .notNull()
      .references(() => skills.id),
    years: real("years"),
    selfReported: boolean("self_reported").notNull().default(true),
  },
  (t) => [primaryKey({ columns: [t.workerId, t.skillId] })],
);

export const workerMedia = pgTable(
  "worker_media",
  {
    id: id(),
    contractorId: contractorId(),
    workerId: uuid("worker_id")
      .notNull()
      .references(() => workers.id, { onDelete: "cascade" }),
    type: mediaTypeEnum("type").notNull(),
    url: text("url").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("worker_media_worker_idx").on(t.workerId)],
);

export const enterprises = pgTable(
  "enterprises",
  {
    id: id(),
    contractorId: contractorId(),
    name: text("name").notNull(),
    phone: text("phone"),
    categoryId: text("category_id").references(() => categories.id),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    areaName: text("area_name"),
    source: enterpriseSourceEnum("source").notNull().default("manual"),
    sourceRef: text("source_ref"), // e.g. OSM id "way/305749443"
    notes: text("notes"),
    isDemo: boolean("is_demo").notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [
    index("enterprises_contractor_idx").on(t.contractorId),
    uniqueIndex("enterprises_source_ref_idx").on(
      t.contractorId,
      t.source,
      t.sourceRef,
    ),
  ],
);

export const needs = pgTable(
  "needs",
  {
    id: id(),
    contractorId: contractorId(),
    enterpriseId: uuid("enterprise_id")
      .notNull()
      .references(() => enterprises.id, { onDelete: "cascade" }),
    skillId: text("skill_id")
      .notNull()
      .references(() => skills.id),
    countNeeded: integer("count_needed").notNull().default(1),
    countFilled: integer("count_filled").notNull().default(0),
    wageOffered: integer("wage_offered"), // ₹ per day
    startDate: date("start_date"),
    status: needStatusEnum("status").notNull().default("open"),
    notes: text("notes"),
    isDemo: boolean("is_demo").notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [index("needs_contractor_idx").on(t.contractorId, t.status)],
);

export const placements = pgTable(
  "placements",
  {
    id: id(),
    contractorId: contractorId(),
    workerId: uuid("worker_id")
      .notNull()
      .references(() => workers.id, { onDelete: "cascade" }),
    needId: uuid("need_id")
      .notNull()
      .references(() => needs.id, { onDelete: "cascade" }),
    startDate: date("start_date").notNull(),
    wage: integer("wage").notNull(),
    probationDays: integer("probation_days").notNull(),
    status: placementStatusEnum("status").notNull().default("awaiting_payment"),
    commissionAmount: integer("commission_amount").notNull(),
    commissionStatus: commissionStateEnum("commission_status").notNull().default("unpaid"),
    // When the shop paid the commission (upfront).
    commissionReceivedAt: timestamp("commission_received_at", {
      withTimezone: true,
    }),
    // Set on a replacement placement: the failed placement it replaces.
    replacementFor: uuid("replacement_for").references((): AnyPgColumn => placements.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [index("placements_contractor_idx").on(t.contractorId, t.status)],
);

export const ratings = pgTable(
  "ratings",
  {
    id: id(),
    contractorId: contractorId(),
    placementId: uuid("placement_id")
      .notNull()
      .references(() => placements.id, { onDelete: "cascade" }),
    workerId: uuid("worker_id")
      .notNull()
      .references(() => workers.id, { onDelete: "cascade" }),
    score: integer("score").notNull(), // 1-5
    note: text("note"),
    createdAt: createdAt(),
  },
  (t) => [index("ratings_worker_idx").on(t.workerId)],
);

export const aiUsage = pgTable(
  "ai_usage",
  {
    id: id(),
    contractorId: uuid("contractor_id").references(() => contractors.id, {
      onDelete: "set null",
    }),
    kind: aiKindEnum("kind").notNull(),
    model: text("model").notNull(),
    audioSeconds: real("audio_seconds"),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    estCostUsd: doublePrecision("est_cost_usd").notNull().default(0),
    allowed: boolean("allowed").notNull(),
    blockedReason: text("blocked_reason"),
    createdAt: createdAt(),
  },
  (t) => [index("ai_usage_created_idx").on(t.createdAt, t.contractorId)],
);

// Cached responses from free public APIs (Overpass, Nominatim), so repeat
// searches of the same area never hit them again.
export const placeCache = pgTable("place_cache", {
  key: text("key").primaryKey(),
  payload: jsonb("payload").notNull(),
  createdAt: createdAt(),
});

// One row per live call to a free public API, for per-contractor and global
// daily limits.
export const externalCalls = pgTable(
  "external_calls",
  {
    id: id(),
    contractorId: uuid("contractor_id").references(() => contractors.id, { onDelete: "set null" }),
    service: externalServiceEnum("service").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("external_calls_created_idx").on(t.createdAt, t.service)],
);
