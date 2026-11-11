-- Removes the unused "official stats in the DB" tables. They only ever held
-- fabricated seed data; official statistics are served from the static
-- snapshot (src/data). DESTRUCTIVE: run only with owner approval, after taking
-- a Neon branch/snapshot of production. See docs/DEPLOY.md.
DROP TABLE IF EXISTS "crime_statistics";--> statement-breakpoint
DROP TABLE IF EXISTS "data_sources";--> statement-breakpoint
DROP TYPE IF EXISTS "public"."crime_category";
