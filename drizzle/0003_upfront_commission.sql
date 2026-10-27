-- Real-world commission flow: the shop pays the commission upfront, before
-- workers are sent; the trial is a guarantee period (refund or replacement).
-- Enums are rebuilt instead of ALTER TYPE ... ADD VALUE, because a newly
-- added enum value can't be used (as a default) in the same transaction.

-- placement_status: + awaiting_payment, + cancelled
ALTER TYPE "public"."placement_status" RENAME TO "placement_status_old";--> statement-breakpoint
CREATE TYPE "public"."placement_status" AS ENUM('awaiting_payment', 'trial', 'confirmed', 'ended', 'failed', 'cancelled');--> statement-breakpoint
ALTER TABLE "placements" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "placements" ALTER COLUMN "status" SET DATA TYPE "public"."placement_status" USING "status"::text::"public"."placement_status";--> statement-breakpoint
ALTER TABLE "placements" ALTER COLUMN "status" SET DEFAULT 'awaiting_payment';--> statement-breakpoint
DROP TYPE "public"."placement_status_old";--> statement-breakpoint

-- commission_status (held/due/received/lost) -> commission_state
CREATE TYPE "public"."commission_state" AS ENUM('unpaid', 'at_risk', 'earned', 'refunded', 'transferred', 'lost');--> statement-breakpoint
ALTER TABLE "placements" ALTER COLUMN "commission_status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "placements" ALTER COLUMN "commission_status" SET DATA TYPE "public"."commission_state" USING (
  CASE "commission_status"::text
    WHEN 'held' THEN 'at_risk'
    WHEN 'due' THEN 'earned'
    WHEN 'received' THEN 'earned'
    ELSE 'lost'
  END
)::"public"."commission_state";--> statement-breakpoint
ALTER TABLE "placements" ALTER COLUMN "commission_status" SET DEFAULT 'unpaid';--> statement-breakpoint
DROP TYPE "public"."commission_status";--> statement-breakpoint

ALTER TABLE "placements" ADD COLUMN "replacement_for" uuid;--> statement-breakpoint
ALTER TABLE "placements" ADD CONSTRAINT "placements_replacement_for_placements_id_fk" FOREIGN KEY ("replacement_for") REFERENCES "public"."placements"("id") ON DELETE set null ON UPDATE no action;
