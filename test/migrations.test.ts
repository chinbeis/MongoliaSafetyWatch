import { readFileSync } from "node:fs";
import { sql } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { normalizeRadius, snapToGrid } from "@/lib/geo-privacy";
import { createTestDb } from "./db";
import type { Database } from "@/db";

let db: Database;

beforeAll(async () => {
  ({ db } = await createTestDb());
});

describe("migration 0007 (privacy backfill)", () => {
  it("snaps legacy rows exactly like snapToGrid / normalizeRadius", async () => {
    const samples = [
      [47.918812345, 106.917312345, 50],
      [49.98, 92.07, 5000],
      [43.57081, 104.42501, 333],
      [48.0767, 114.5326, 1025],
      [46.1917999, 100.7178111, 260],
    ] as const;
    for (const [lat, lng, radius] of samples) {
      await db.execute(sql`
        INSERT INTO community_reports (category, latitude, longitude, radius_meters)
        VALUES ('other', ${lat}, ${lng}, ${radius})
      `);
    }

    const migration = readFileSync("drizzle/0007_community_report_privacy.sql", "utf8");
    for (const statement of migration.split("--> statement-breakpoint")) {
      if (statement.trim()) {
        await db.execute(sql.raw(statement));
      }
    }

    const rows = await db.execute<{ latitude: number; longitude: number; radius_meters: number }>(
      sql`SELECT latitude, longitude, radius_meters FROM community_reports ORDER BY created_at, id`
    );
    const byInput = new Map(rows.rows.map((row) => [`${row.latitude},${row.longitude}`, row]));

    for (const [lat, lng, radius] of samples) {
      const expected = snapToGrid(lat, lng);
      const row = byInput.get(`${expected.latitude},${expected.longitude}`);
      expect(row, `no row snapped to ${expected.latitude},${expected.longitude}`).toBeDefined();
      expect(row!.radius_meters).toBe(normalizeRadius(radius));
    }
  });
});
