CREATE TYPE "public"."crime_category" AS ENUM('theft', 'violence', 'child_related', 'other');--> statement-breakpoint
CREATE TABLE "crime_statistics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"region_code" varchar(10) NOT NULL,
	"region_name" varchar(100) NOT NULL,
	"year" integer NOT NULL,
	"crime_category" "crime_category" NOT NULL,
	"incident_count" integer NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"source" varchar(255) NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"url" varchar(255) NOT NULL,
	"description" varchar(1000) NOT NULL,
	"last_updated" date NOT NULL
);
