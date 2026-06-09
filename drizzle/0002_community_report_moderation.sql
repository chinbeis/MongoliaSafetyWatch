ALTER TABLE "community_reports" ADD COLUMN "flag_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "community_reports" ADD COLUMN "hidden" boolean DEFAULT false NOT NULL;
