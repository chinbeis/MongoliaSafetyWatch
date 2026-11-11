import "server-only";
import { randomInt } from "node:crypto";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";

export interface RateLimitResult {
  allowed: boolean;
  count: number;
  remaining: number;
  retryAfterSeconds: number;
}

type CounterRow = { count: number; window_start: Date | string };

const CLEANUP_PROBABILITY = 50; // 1-in-50 requests prune stale rows
const STALE_AFTER = "2 days";

/**
 * Postgres-backed fixed-window counter. A single atomic
 * INSERT … ON CONFLICT DO UPDATE increments the counter, or resets it when
 * the stored window has expired — correct across serverless instances, and
 * needs no interactive transaction (Neon HTTP has none).
 *
 * Every call counts, including requests that are then rejected.
 */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const db = getDb();
  const windowSeconds = windowMs / 1000;

  const result = await db.execute<CounterRow>(sql`
    INSERT INTO rate_limits (key, count, window_start)
    VALUES (${key}, 1, now())
    ON CONFLICT (key) DO UPDATE SET
      count = CASE
        WHEN rate_limits.window_start <= now() - make_interval(secs => ${windowSeconds}) THEN 1
        ELSE rate_limits.count + 1
      END,
      window_start = CASE
        WHEN rate_limits.window_start <= now() - make_interval(secs => ${windowSeconds}) THEN now()
        ELSE rate_limits.window_start
      END
    RETURNING count::int AS count, window_start
  `);

  await maybeCleanup();

  const row = result.rows[0];
  const count = Number(row.count);
  const windowStart = new Date(row.window_start).getTime();
  const retryAfterSeconds = Math.max(1, Math.ceil((windowStart + windowMs - Date.now()) / 1000));

  return {
    allowed: count <= limit,
    count,
    remaining: Math.max(0, limit - count),
    retryAfterSeconds: count <= limit ? 0 : retryAfterSeconds,
  };
}

/** Read-only check: is this key currently over its limit? Does not count. */
export async function isRateLimited(key: string, limit: number, windowMs: number): Promise<boolean> {
  const db = getDb();
  const result = await db.execute<{ count: number }>(sql`
    SELECT count::int AS count FROM rate_limits
    WHERE key = ${key} AND window_start > now() - make_interval(secs => ${windowMs / 1000})
  `);
  const row = result.rows[0];
  return row ? Number(row.count) >= limit : false;
}

/**
 * Records a one-time token (e.g. a captcha nonce). Returns false if the token
 * was already used. Stored in rate_limits so the same cleanup expires it.
 */
export async function consumeOnce(key: string): Promise<boolean> {
  const db = getDb();
  const result = await db.execute<{ key: string }>(sql`
    INSERT INTO rate_limits (key, count, window_start)
    VALUES (${key}, 1, now())
    ON CONFLICT (key) DO NOTHING
    RETURNING key
  `);
  return result.rows.length === 1;
}

async function maybeCleanup() {
  if (randomInt(CLEANUP_PROBABILITY) !== 0) {
    return;
  }
  try {
    await getDb().execute(sql`
      DELETE FROM rate_limits WHERE window_start < now() - ${sql.raw(`interval '${STALE_AFTER}'`)}
    `);
  } catch (error) {
    console.error("rate_limits cleanup failed", error);
  }
}

export const MINUTE_MS = 60 * 1000;
export const HOUR_MS = 60 * MINUTE_MS;
export const DAY_MS = 24 * HOUR_MS;
