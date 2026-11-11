-- DESTRUCTIVE DATA CHANGE — run only with owner approval, after taking a Neon
-- branch/snapshot of production (docs/DEPLOY.md).
--
-- 1. Snap existing pins to the 250 m grid and clamp radius to 250–2000 m,
--    using the same formula as src/lib/geo-privacy.ts (snapToGrid,
--    normalizeRadius). Rows written after this migration are snapped by the
--    API before insert.
-- 2. Drop the free-text-capable columns the API no longer writes.
WITH lat_snapped AS (
	SELECT
		"id",
		"longitude",
		(floor("latitude" / (250 / 111320.0)) + 0.5) * (250 / 111320.0) AS "lat_c"
	FROM "community_reports"
), snapped AS (
	SELECT
		"id",
		"lat_c",
		(floor("longitude" / (250 / (111320.0 * cos(radians("lat_c"))))) + 0.5)
			* (250 / (111320.0 * cos(radians("lat_c")))) AS "lng_c"
	FROM lat_snapped
)
UPDATE "community_reports" AS r
SET
	"latitude" = round(snapped."lat_c"::numeric, 4)::double precision,
	"longitude" = round(snapped."lng_c"::numeric, 4)::double precision
FROM snapped
WHERE r."id" = snapped."id";
--> statement-breakpoint
UPDATE "community_reports"
SET "radius_meters" = LEAST(2000, GREATEST(250, (round("radius_meters" / 50.0) * 50)::integer));
--> statement-breakpoint
ALTER TABLE "community_reports" DROP COLUMN IF EXISTS "title";--> statement-breakpoint
ALTER TABLE "community_reports" DROP COLUMN IF EXISTS "details";--> statement-breakpoint
ALTER TABLE "community_reports" DROP COLUMN IF EXISTS "area_label";
