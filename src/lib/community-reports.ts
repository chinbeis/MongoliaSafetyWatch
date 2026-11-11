import "server-only";
import { and, desc, eq, gt, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { communityReports } from "@/db/schema";
import {
  COMMUNITY_CATEGORY_VALUES,
  REPORT_TTL_DAYS,
  type CommunityCategory,
  type PublicCommunityReport,
} from "@/lib/community-categories";
import { MAX_RADIUS_M, MIN_RADIUS_M, normalizeRadius, snapToGrid } from "@/lib/geo-privacy";

export const PUBLIC_REPORT_LIMIT = 500;
export const FLAG_THRESHOLD = 3;

/** POST body for creating a pin. Strict: unknown keys (e.g. free text) are rejected. */
export const createReportSchema = z.strictObject({
  category: z.enum(COMMUNITY_CATEGORY_VALUES),
  latitude: z.number().finite(),
  longitude: z.number().finite(),
  radiusMeters: z.number().finite().min(MIN_RADIUS_M).max(MAX_RADIUS_M),
  turnstileToken: z.string().max(4096).optional(),
  captchaToken: z.string().max(1024).optional(),
  captchaAnswer: z.number().int().min(0).max(100).optional(),
});

export const flagReportSchema = z.strictObject({
  turnstileToken: z.string().max(4096).optional(),
});

/**
 * Projects a row to the public shape. Coordinates are re-snapped and the
 * radius re-clamped on the way out, so the privacy invariant holds even for
 * rows written before snapping existed.
 */
export function toPublicReport(row: {
  id: string;
  category: CommunityCategory;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  createdAt: Date;
}): PublicCommunityReport {
  const point = snapToGrid(row.latitude, row.longitude);
  return {
    id: row.id,
    category: row.category,
    latitude: point.latitude,
    longitude: point.longitude,
    radiusMeters: normalizeRadius(row.radiusMeters),
    createdAt: row.createdAt.toISOString(),
  };
}

const publicColumns = {
  id: communityReports.id,
  category: communityReports.category,
  latitude: communityReports.latitude,
  longitude: communityReports.longitude,
  radiusMeters: communityReports.radiusMeters,
  createdAt: communityReports.createdAt,
};

export async function listPublicReports(): Promise<PublicCommunityReport[]> {
  const rows = await getDb()
    .select(publicColumns)
    .from(communityReports)
    .where(
      and(
        eq(communityReports.status, "visible"),
        gt(communityReports.createdAt, sql`now() - make_interval(days => ${REPORT_TTL_DAYS})`)
      )
    )
    .orderBy(desc(communityReports.createdAt))
    .limit(PUBLIC_REPORT_LIMIT);
  return rows.map(toPublicReport);
}

export async function insertReport(input: {
  category: CommunityCategory;
  latitude: number;
  longitude: number;
  radiusMeters: number;
}): Promise<PublicCommunityReport> {
  const point = snapToGrid(input.latitude, input.longitude);
  const [row] = await getDb()
    .insert(communityReports)
    .values({
      category: input.category,
      latitude: point.latitude,
      longitude: point.longitude,
      radiusMeters: normalizeRadius(input.radiusMeters),
    })
    .returning(publicColumns);
  return toPublicReport(row);
}

export type FlagOutcome = { found: false } | { found: true; status: string; flagCount: number };

/**
 * Records one flag per voter per report and moves the report to the review
 * queue once FLAG_THRESHOLD distinct voters have flagged it — in one atomic
 * statement. Repeat flags from the same voter are no-ops.
 */
export async function flagReport(reportId: string, voterKey: string): Promise<FlagOutcome> {
  const result = await getDb().execute<{ status: string; flag_count: number }>(sql`
    WITH target AS (
      SELECT id FROM community_reports WHERE id = ${reportId} AND status = 'visible'
    ), inserted AS (
      INSERT INTO community_report_flags (report_id, voter_key)
      SELECT id, ${voterKey} FROM target
      ON CONFLICT DO NOTHING
      RETURNING report_id
    ), counted AS (
      SELECT
        (SELECT count(*) FROM community_report_flags WHERE report_id = ${reportId})
        + (SELECT count(*) FROM inserted) AS n
    )
    UPDATE community_reports AS r
    SET
      flag_count = counted.n,
      status = CASE WHEN counted.n >= ${FLAG_THRESHOLD} THEN 'pending_review'::community_report_status ELSE r.status END
    FROM counted, target
    WHERE r.id = target.id
    RETURNING r.status::text AS status, r.flag_count::int AS flag_count
  `);

  const row = result.rows[0];
  if (!row) {
    return { found: false };
  }
  return { found: true, status: row.status, flagCount: Number(row.flag_count) };
}
