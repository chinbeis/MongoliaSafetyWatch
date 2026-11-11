-- Replace the permanent "hidden" boolean with a moderation status.
-- Reports previously auto-hidden by flags go to the review queue rather than
-- being treated as removed.
CREATE TYPE "public"."community_report_status" AS ENUM('visible', 'pending_review', 'removed');--> statement-breakpoint
ALTER TABLE "community_reports" ADD COLUMN "status" "community_report_status" DEFAULT 'visible' NOT NULL;--> statement-breakpoint
UPDATE "community_reports" SET "status" = 'pending_review' WHERE "hidden" = true;--> statement-breakpoint
ALTER TABLE "community_reports" DROP COLUMN "hidden";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "community_reports_status_created_at_idx" ON "community_reports" ("status", "created_at" DESC);
