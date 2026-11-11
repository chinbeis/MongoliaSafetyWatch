import { pgTable, uuid, varchar, integer, timestamp, pgEnum, doublePrecision, text, boolean } from "drizzle-orm/pg-core";

export const communityReportCategoryEnum = pgEnum("community_report_category", [
  "suspicious_activity",
  "theft",
  "violence",
  "harassment",
  "child_safety",
  "other",
]);

export const communityReports = pgTable("community_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  category: communityReportCategoryEnum("category").notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  details: text("details"),
  areaLabel: varchar("area_label", { length: 160 }),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  radiusMeters: integer("radius_meters").notNull(),
  flagCount: integer("flag_count").default(0).notNull(),
  hidden: boolean("hidden").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
