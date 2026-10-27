CREATE TYPE "public"."ai_kind" AS ENUM('transcribe', 'extract');--> statement-breakpoint
CREATE TYPE "public"."availability" AS ENUM('available', 'placed', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."commission_status" AS ENUM('held', 'due', 'received', 'lost');--> statement-breakpoint
CREATE TYPE "public"."enterprise_source" AS ENUM('manual', 'osm', 'google');--> statement-breakpoint
CREATE TYPE "public"."media_type" AS ENUM('photo', 'video');--> statement-breakpoint
CREATE TYPE "public"."need_status" AS ENUM('open', 'filled', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."placement_status" AS ENUM('trial', 'confirmed', 'ended', 'failed');--> statement-breakpoint
CREATE TABLE "ai_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contractor_id" uuid,
	"kind" "ai_kind" NOT NULL,
	"model" text NOT NULL,
	"audio_seconds" real,
	"input_tokens" integer,
	"output_tokens" integer,
	"est_cost_usd" double precision DEFAULT 0 NOT NULL,
	"allowed" boolean NOT NULL,
	"blocked_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name_en" text NOT NULL,
	"name_ml" text NOT NULL,
	"osm_tags" text[] DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "category_roles" (
	"category_id" text NOT NULL,
	"skill_id" text NOT NULL,
	CONSTRAINT "category_roles_category_id_skill_id_pk" PRIMARY KEY("category_id","skill_id")
);
--> statement-breakpoint
CREATE TABLE "contractors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"pin_hash" text NOT NULL,
	"base_lat" double precision,
	"base_lng" double precision,
	"area_name" text,
	"default_probation_days" integer DEFAULT 7 NOT NULL,
	"failed_pin_attempts" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contractors_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "enterprises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contractor_id" uuid NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"category_id" text,
	"lat" double precision,
	"lng" double precision,
	"area_name" text,
	"source" "enterprise_source" DEFAULT 'manual' NOT NULL,
	"source_ref" text,
	"notes" text,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "needs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contractor_id" uuid NOT NULL,
	"enterprise_id" uuid NOT NULL,
	"skill_id" text NOT NULL,
	"count_needed" integer DEFAULT 1 NOT NULL,
	"count_filled" integer DEFAULT 0 NOT NULL,
	"wage_offered" integer,
	"start_date" date,
	"status" "need_status" DEFAULT 'open' NOT NULL,
	"notes" text,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "placements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contractor_id" uuid NOT NULL,
	"worker_id" uuid NOT NULL,
	"need_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"wage" integer NOT NULL,
	"probation_days" integer NOT NULL,
	"status" "placement_status" DEFAULT 'trial' NOT NULL,
	"commission_amount" integer NOT NULL,
	"commission_status" "commission_status" DEFAULT 'held' NOT NULL,
	"commission_received_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contractor_id" uuid NOT NULL,
	"placement_id" uuid NOT NULL,
	"worker_id" uuid NOT NULL,
	"score" integer NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"contractor_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" text PRIMARY KEY NOT NULL,
	"canonical_name_en" text NOT NULL,
	"name_ml" text NOT NULL,
	"synonyms" text[] DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "worker_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contractor_id" uuid NOT NULL,
	"worker_id" uuid NOT NULL,
	"type" "media_type" NOT NULL,
	"url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "worker_skills" (
	"worker_id" uuid NOT NULL,
	"skill_id" text NOT NULL,
	"years" real,
	"self_reported" boolean DEFAULT true NOT NULL,
	CONSTRAINT "worker_skills_worker_id_skill_id_pk" PRIMARY KEY("worker_id","skill_id")
);
--> statement-breakpoint
CREATE TABLE "workers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contractor_id" uuid NOT NULL,
	"name" text NOT NULL,
	"photo_url" text,
	"home_state" text,
	"languages" text[] DEFAULT '{}' NOT NULL,
	"expected_wage" integer,
	"availability" "availability" DEFAULT 'available' NOT NULL,
	"notes" text,
	"voice_note_url" text,
	"transcript" text,
	"media_consent" boolean DEFAULT false NOT NULL,
	"share_token" text,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workers_share_token_unique" UNIQUE("share_token")
);
--> statement-breakpoint
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_contractor_id_contractors_id_fk" FOREIGN KEY ("contractor_id") REFERENCES "public"."contractors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_roles" ADD CONSTRAINT "category_roles_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_roles" ADD CONSTRAINT "category_roles_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprises" ADD CONSTRAINT "enterprises_contractor_id_contractors_id_fk" FOREIGN KEY ("contractor_id") REFERENCES "public"."contractors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprises" ADD CONSTRAINT "enterprises_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "needs" ADD CONSTRAINT "needs_contractor_id_contractors_id_fk" FOREIGN KEY ("contractor_id") REFERENCES "public"."contractors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "needs" ADD CONSTRAINT "needs_enterprise_id_enterprises_id_fk" FOREIGN KEY ("enterprise_id") REFERENCES "public"."enterprises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "needs" ADD CONSTRAINT "needs_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placements" ADD CONSTRAINT "placements_contractor_id_contractors_id_fk" FOREIGN KEY ("contractor_id") REFERENCES "public"."contractors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placements" ADD CONSTRAINT "placements_worker_id_workers_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placements" ADD CONSTRAINT "placements_need_id_needs_id_fk" FOREIGN KEY ("need_id") REFERENCES "public"."needs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_contractor_id_contractors_id_fk" FOREIGN KEY ("contractor_id") REFERENCES "public"."contractors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_placement_id_placements_id_fk" FOREIGN KEY ("placement_id") REFERENCES "public"."placements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_worker_id_workers_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_contractor_id_contractors_id_fk" FOREIGN KEY ("contractor_id") REFERENCES "public"."contractors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_media" ADD CONSTRAINT "worker_media_contractor_id_contractors_id_fk" FOREIGN KEY ("contractor_id") REFERENCES "public"."contractors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_media" ADD CONSTRAINT "worker_media_worker_id_workers_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_skills" ADD CONSTRAINT "worker_skills_worker_id_workers_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_skills" ADD CONSTRAINT "worker_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workers" ADD CONSTRAINT "workers_contractor_id_contractors_id_fk" FOREIGN KEY ("contractor_id") REFERENCES "public"."contractors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_usage_created_idx" ON "ai_usage" USING btree ("created_at","contractor_id");--> statement-breakpoint
CREATE INDEX "enterprises_contractor_idx" ON "enterprises" USING btree ("contractor_id");--> statement-breakpoint
CREATE UNIQUE INDEX "enterprises_source_ref_idx" ON "enterprises" USING btree ("contractor_id","source","source_ref");--> statement-breakpoint
CREATE INDEX "needs_contractor_idx" ON "needs" USING btree ("contractor_id","status");--> statement-breakpoint
CREATE INDEX "placements_contractor_idx" ON "placements" USING btree ("contractor_id","status");--> statement-breakpoint
CREATE INDEX "ratings_worker_idx" ON "ratings" USING btree ("worker_id");--> statement-breakpoint
CREATE INDEX "sessions_contractor_idx" ON "sessions" USING btree ("contractor_id");--> statement-breakpoint
CREATE INDEX "worker_media_worker_idx" ON "worker_media" USING btree ("worker_id");--> statement-breakpoint
CREATE INDEX "workers_contractor_idx" ON "workers" USING btree ("contractor_id","availability");