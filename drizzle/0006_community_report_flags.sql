-- One flag per client per report. voter_key is the same daily-salted HMAC used
-- by the rate limiter, so it cannot be reversed to an IP address.
CREATE TABLE IF NOT EXISTS "community_report_flags" (
	"report_id" uuid NOT NULL REFERENCES "community_reports"("id") ON DELETE CASCADE,
	"voter_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "community_report_flags_pk" PRIMARY KEY ("report_id", "voter_key")
);
--> statement-breakpoint
UPDATE "community_reports" SET "flag_count" = 0 WHERE "status" = 'visible';
