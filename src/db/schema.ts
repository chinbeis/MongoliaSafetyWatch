import { sql } from "drizzle-orm";
import {
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const communityReportCategoryEnum = pgEnum("community_report_category", [
  "suspicious_activity",
  "theft",
  "violence",
  "harassment",
  "child_safety",
  "other",
]);

export const communityReportStatusEnum = pgEnum("community_report_status", [
  "visible",
  "pending_review",
  "removed",
]);

/**
 * Anonymous, area-level community pins. There is deliberately no free-text
 * column: category + snapped coordinates + radius is all a pin can carry.
 */
export const communityReports = pgTable(
  "community_reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    category: communityReportCategoryEnum("category").notNull(),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    radiusMeters: integer("radius_meters").notNull(),
    flagCount: integer("flag_count").default(0).notNull(),
    status: communityReportStatusEnum("status").default("visible").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("community_reports_status_created_at_idx").on(table.status, table.createdAt.desc())]
);

export const communityReportFlags = pgTable(
  "community_report_flags",
  {
    reportId: uuid("report_id")
      .notNull()
      .references(() => communityReports.id, { onDelete: "cascade" }),
    voterKey: text("voter_key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
  },
  (table) => [primaryKey({ name: "community_report_flags_pk", columns: [table.reportId, table.voterKey] })]
);

export const rateLimits = pgTable(
  "rate_limits",
  {
    key: text("key").primaryKey(),
    count: integer("count").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
  },
  (table) => [index("rate_limits_window_start_idx").on(table.windowStart)]
);

export type CommunityReportStatus = (typeof communityReportStatusEnum.enumValues)[number];
