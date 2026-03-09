CREATE TYPE "public"."community_report_category" AS ENUM(
	'suspicious_activity',
	'theft',
	'violence',
	'harassment',
	'child_safety',
	'other'
);
--> statement-breakpoint
CREATE TABLE "community_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" "community_report_category" NOT NULL,
	"title" varchar(160) NOT NULL,
	"details" text,
	"area_label" varchar(160),
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"radius_meters" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
