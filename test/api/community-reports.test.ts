import { sql } from "drizzle-orm";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb } from "../db";
import { freshIp, getRequest, jsonRequest, params } from "../request";

const mocks = vi.hoisted(() => ({ db: null as unknown }));
vi.mock("@/db", () => ({ getDb: () => mocks.db }));

import { GET as getChallenge } from "@/app/api/community-reports/challenge/route";
import { GET as listReports, POST as createReport } from "@/app/api/community-reports/route";
import { POST as flagReport } from "@/app/api/community-reports/[id]/flag/route";
import { GET as adminList } from "@/app/api/admin/reports/route";
import { POST as adminModerate } from "@/app/api/admin/reports/[id]/route";
import { resetServerEnvForTests } from "@/lib/env";
import type { Database } from "@/db";

let db: Database;

beforeAll(async () => {
  ({ db } = await createTestDb());
  mocks.db = db;
});

beforeEach(async () => {
  await db.execute(sql`DELETE FROM community_report_flags`);
  await db.execute(sql`DELETE FROM community_reports`);
  await db.execute(sql`DELETE FROM rate_limits`);
});

afterEach(() => {
  delete process.env.COMMUNITY_REPORTS_READONLY;
  delete process.env.ADMIN_TOKEN;
  resetServerEnvForTests();
});

async function solveChallenge(ip: string) {
  const response = await getChallenge(getRequest("/api/community-reports/challenge", ip));
  const body = (await response.json()) as { mode: string; token: string; prompt: string };
  expect(body.mode).toBe("math");
  const [left, right] = body.prompt.match(/\d+/g)!.map(Number);
  return { captchaToken: body.token, captchaAnswer: left + right };
}

const validPin = {
  category: "theft",
  latitude: 47.918812345,
  longitude: 106.917312345,
  radiusMeters: 512,
};

async function createPin(ip = freshIp(), overrides: Record<string, unknown> = {}) {
  const captcha = await solveChallenge(ip);
  return createReport(jsonRequest("/api/community-reports", { ...validPin, ...captcha, ...overrides }, ip));
}

function decimals(value: number) {
  const text = String(value);
  return text.includes(".") ? text.split(".")[1].length : 0;
}

async function publicReports() {
  const response = await listReports();
  expect(response.status).toBe(200);
  return ((await response.json()) as { reports: Array<Record<string, unknown>> }).reports;
}

describe("POST /api/community-reports", () => {
  it("creates a pin snapped to the grid with a clamped radius", async () => {
    const response = await createPin();
    expect(response.status).toBe(201);
    const { report } = (await response.json()) as { report: Record<string, number | string> };
    expect(Object.keys(report).sort()).toEqual(["category", "createdAt", "id", "latitude", "longitude", "radiusMeters"]);
    expect(decimals(report.latitude as number)).toBeLessThanOrEqual(4);
    expect(decimals(report.longitude as number)).toBeLessThanOrEqual(4);
    expect(report.radiusMeters).toBe(500);
  });

  it("rejects a missing or malformed body with 400", async () => {
    const ip = freshIp();
    expect((await createReport(jsonRequest("/api/community-reports", "not json", ip))).status).toBe(400);
    const empty = await createReport(jsonRequest("/api/community-reports", {}, freshIp()));
    expect(empty.status).toBe(400);
    const body = (await empty.json()) as { error: string; message: string };
    expect(body.error).toBe("invalid_body");
    expect(body.message).toMatch(/[А-Яа-яӨөҮү]/);
  });

  it("rejects free text and unknown fields", async () => {
    const response = await createPin(freshIp(), { title: "Хаяг: ..." });
    expect(response.status).toBe(400);
  });

  it("rejects a radius below the minimum and points outside Mongolia", async () => {
    expect((await createPin(freshIp(), { radiusMeters: 50 })).status).toBe(400);
    const outside = await createPin(freshIp(), { latitude: 40.1, longitude: 116.4 });
    expect(outside.status).toBe(400);
    expect(((await outside.json()) as { error: string }).error).toBe("out_of_bounds");
  });

  it("rejects a wrong captcha answer", async () => {
    const ip = freshIp();
    const captcha = await solveChallenge(ip);
    const response = await createReport(
      jsonRequest("/api/community-reports", { ...validPin, ...captcha, captchaAnswer: captcha.captchaAnswer + 1 }, ip)
    );
    expect(response.status).toBe(400);
    expect(((await response.json()) as { error: string }).error).toBe("bot_check_failed");
  });

  it("rejects a replayed captcha token", async () => {
    const ip = freshIp();
    const captcha = await solveChallenge(ip);
    const first = await createReport(jsonRequest("/api/community-reports", { ...validPin, ...captcha }, ip));
    expect(first.status).toBe(201);
    const replay = await createReport(jsonRequest("/api/community-reports", { ...validPin, ...captcha }, freshIp()));
    expect(replay.status).toBe(400);
    expect(((await replay.json()) as { error: string }).error).toBe("bot_check_reused");
  });

  it("allows 3 creates per client per 10 minutes, then 429", async () => {
    const ip = freshIp();
    for (let i = 0; i < 3; i += 1) {
      expect((await createPin(ip)).status).toBe(201);
    }
    const fourth = await createPin(ip);
    expect(fourth.status).toBe(429);
    expect(Number(fourth.headers.get("Retry-After"))).toBeGreaterThan(0);
  });

  it("returns 503 in read-only mode", async () => {
    process.env.COMMUNITY_REPORTS_READONLY = "1";
    resetServerEnvForTests();
    const response = await createReport(jsonRequest("/api/community-reports", validPin, freshIp()));
    expect(response.status).toBe(503);
    const challenge = await getChallenge(getRequest("/api/community-reports/challenge", freshIp()));
    expect(await challenge.json()).toEqual({ readonly: true });
  });
});

describe("GET /api/community-reports", () => {
  it("returns only the public projection, snapped, with cache headers", async () => {
    // A legacy row written before snapping existed.
    await db.execute(sql`
      INSERT INTO community_reports (category, latitude, longitude, radius_meters)
      VALUES ('violence', 47.91881234567, 106.91731234567, 50)
    `);
    const response = await listReports();
    expect(response.headers.get("Cache-Control")).toContain("s-maxage=30");
    const reports = await publicReports();
    expect(reports).toHaveLength(1);
    for (const report of reports) {
      expect(Object.keys(report).sort()).toEqual(["category", "createdAt", "id", "latitude", "longitude", "radiusMeters"]);
      expect(decimals(report.latitude as number)).toBeLessThanOrEqual(4);
      expect(decimals(report.longitude as number)).toBeLessThanOrEqual(4);
      expect(report.radiusMeters as number).toBeGreaterThanOrEqual(250);
    }
  });

  it("hides pins older than 30 days and pins that are not visible", async () => {
    await db.execute(sql`
      INSERT INTO community_reports (category, latitude, longitude, radius_meters, created_at, status) VALUES
        ('theft', 47.9, 106.9, 500, now() - interval '31 days', 'visible'),
        ('theft', 47.9, 106.9, 500, now() - interval '1 day', 'pending_review'),
        ('theft', 47.9, 106.9, 500, now() - interval '1 day', 'removed'),
        ('theft', 47.9, 106.9, 500, now() - interval '20 days', 'visible')
    `);
    expect(await publicReports()).toHaveLength(1);
  });
});

describe("POST /api/community-reports/[id]/flag", () => {
  async function createdId() {
    const response = await createPin();
    return ((await response.json()) as { report: { id: string } }).report.id;
  }

  it("rejects a non-UUID id with 400", async () => {
    const response = await flagReport(jsonRequest("/api/community-reports/x/flag", {}, freshIp()), params({ id: "1 OR 1=1" }));
    expect(response.status).toBe(400);
    expect(((await response.json()) as { error: string }).error).toBe("invalid_id");
  });

  it("returns 404 for an unknown report", async () => {
    const response = await flagReport(
      jsonRequest("/api/community-reports/x/flag", {}, freshIp()),
      params({ id: "00000000-0000-4000-8000-000000000000" })
    );
    expect(response.status).toBe(404);
  });

  it("counts repeated flags from the same client once", async () => {
    const id = await createdId();
    const ip = freshIp();
    for (let i = 0; i < 5; i += 1) {
      const response = await flagReport(jsonRequest(`/api/community-reports/${id}/flag`, {}, ip), params({ id }));
      expect(response.status).toBe(200);
    }
    expect(await publicReports()).toHaveLength(1);
    const rows = await db.execute<{ flag_count: number; status: string }>(
      sql`SELECT flag_count, status::text AS status FROM community_reports WHERE id = ${id}`
    );
    expect(Number(rows.rows[0].flag_count)).toBe(1);
    expect(rows.rows[0].status).toBe("visible");
  });

  it("moves a pin to review after three distinct clients and removes it from GET", async () => {
    const id = await createdId();
    let last: Response | undefined;
    for (let i = 0; i < 3; i += 1) {
      last = await flagReport(jsonRequest(`/api/community-reports/${id}/flag`, {}, freshIp()), params({ id }));
      expect(last.status).toBe(200);
    }
    expect(await last!.json()).toEqual({ ok: true, hidden: true });
    expect(await publicReports()).toHaveLength(0);
    const rows = await db.execute<{ status: string }>(
      sql`SELECT status::text AS status FROM community_reports WHERE id = ${id}`
    );
    expect(rows.rows[0].status).toBe("pending_review");
  });
});

describe("admin moderation API", () => {
  const TOKEN = "t".repeat(48);

  function adminGet(path: string, token?: string, ip = freshIp()) {
    return adminList(getRequest(path, ip, token ? { authorization: `Bearer ${token}` } : {}));
  }

  it("does not exist when ADMIN_TOKEN is unset", async () => {
    expect((await adminGet("/api/admin/reports", "anything")).status).toBe(404);
  });

  it("requires the token and locks out after 5 failures", async () => {
    process.env.ADMIN_TOKEN = TOKEN;
    resetServerEnvForTests();
    const ip = freshIp();
    expect((await adminGet("/api/admin/reports", undefined, ip)).status).toBe(401);
    for (let i = 0; i < 4; i += 1) {
      expect((await adminGet("/api/admin/reports", "wrong", ip)).status).toBe(401);
    }
    // Locked out even with the right token until the window passes.
    expect((await adminGet("/api/admin/reports", TOKEN, ip)).status).toBe(429);
    expect((await adminGet("/api/admin/reports", TOKEN)).status).toBe(200);
  });

  it("lists the review queue and restores or removes pins", async () => {
    process.env.ADMIN_TOKEN = TOKEN;
    resetServerEnvForTests();
    const inserted = await db.execute<{ id: string }>(sql`
      INSERT INTO community_reports (category, latitude, longitude, radius_meters, status, flag_count)
      VALUES ('other', 47.9, 106.9, 500, 'pending_review', 3), ('other', 47.9, 106.9, 500, 'pending_review', 3)
      RETURNING id
    `);
    const [a, b] = inserted.rows.map((row) => row.id);

    const queue = await adminGet("/api/admin/reports?status=pending_review", TOKEN);
    const data = (await queue.json()) as { reports: Array<{ id: string }>; counts: Record<string, number> };
    expect(data.reports.map((r) => r.id).sort()).toEqual([a, b].sort());
    expect(data.counts.pending_review).toBe(2);

    const auth = { headers: { authorization: `Bearer ${TOKEN}` } };
    expect(
      (await adminModerate(jsonRequest(`/api/admin/reports/${a}`, { action: "restore" }, freshIp(), auth), params({ id: a })))
        .status
    ).toBe(200);
    expect(
      (await adminModerate(jsonRequest(`/api/admin/reports/${b}`, { action: "remove" }, freshIp(), auth), params({ id: b })))
        .status
    ).toBe(200);
    expect(
      (await adminModerate(jsonRequest(`/api/admin/reports/${b}`, { action: "nuke" }, freshIp(), auth), params({ id: b })))
        .status
    ).toBe(400);

    const visible = await publicReports();
    expect(visible.map((r) => r.id)).toEqual([a]);
  });
});
