import "server-only";
import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { communityReports, type CommunityReportStatus } from "@/db/schema";

export const adminStatusSchema = z.enum(["pending_review", "visible", "removed"]);
export const adminActionSchema = z.strictObject({ action: z.enum(["restore", "remove"]) });

export interface AdminReport {
  id: string;
  category: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  flagCount: number;
  status: CommunityReportStatus;
  createdAt: string;
}

export async function listAdminReports(status: CommunityReportStatus) {
  const db = getDb();
  const rows = await db
    .select({
      id: communityReports.id,
      category: communityReports.category,
      latitude: communityReports.latitude,
      longitude: communityReports.longitude,
      radiusMeters: communityReports.radiusMeters,
      flagCount: communityReports.flagCount,
      status: communityReports.status,
      createdAt: communityReports.createdAt,
    })
    .from(communityReports)
    .where(eq(communityReports.status, status))
    .orderBy(desc(communityReports.createdAt))
    .limit(200);

  const counts = await db
    .select({ status: communityReports.status, count: sql<number>`count(*)::int` })
    .from(communityReports)
    .groupBy(communityReports.status);

  return {
    reports: rows.map<AdminReport>((row) => ({ ...row, createdAt: row.createdAt.toISOString() })),
    counts: Object.fromEntries(counts.map((row) => [row.status, Number(row.count)])) as Partial<
      Record<CommunityReportStatus, number>
    >,
  };
}

/** restore → visible again with its flags cleared; remove → hidden for good. */
export async function moderateReport(id: string, action: "restore" | "remove") {
  const db = getDb();
  if (action === "restore") {
    const result = await db.execute<{ id: string }>(sql`
      WITH cleared AS (DELETE FROM community_report_flags WHERE report_id = ${id})
      UPDATE community_reports SET status = 'visible', flag_count = 0
      WHERE id = ${id}
      RETURNING id
    `);
    return result.rows.length === 1;
  }
  const rows = await db
    .update(communityReports)
    .set({ status: "removed" })
    .where(eq(communityReports.id, id))
    .returning({ id: communityReports.id });
  return rows.length === 1;
}
