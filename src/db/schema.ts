import { pgTable, uuid, varchar, integer, timestamp, date, pgEnum, doublePrecision } from "drizzle-orm/pg-core";

export const crimeCategoryEnum = pgEnum("crime_category", [
  "theft",
  "violence",
  "child_related",
  "other",
]);

export const crimeStatistics = pgTable("crime_statistics", {
  id: uuid("id").defaultRandom().primaryKey(),
  regionCode: varchar("region_code", { length: 10 }).notNull(),
  regionName: varchar("region_name", { length: 100 }).notNull(),
  year: integer("year").notNull(),
  crimeCategory: crimeCategoryEnum("crime_category").notNull(),
  incidentCount: integer("incident_count").notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  source: varchar("source", { length: 255 }).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const dataSources = pgTable("data_sources", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  url: varchar("url", { length: 255 }).notNull(),
  description: varchar("description", { length: 1000 }).notNull(),
  lastUpdated: date("last_updated").notNull(),
});
