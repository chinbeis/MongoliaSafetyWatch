import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { DatabaseNotConfiguredError, getDb } from "@/db";
import { getCommunityWriteStatus } from "@/lib/community-bot-check";
import { getDataThrough } from "@/lib/crime-snapshot";
import { getServerEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

const DB_TIMEOUT_MS = 3000;

/**
 * Uptime probe. Reports component status only — never secrets, versions,
 * hostnames or error messages. 200 when everything is healthy, else 503.
 */
export async function GET() {
  let env: "ok" | "invalid" = "ok";
  try {
    getServerEnv();
  } catch {
    env = "invalid";
  }

  let db: "ok" | "error" | "not_configured" = "error";
  if (env === "ok") {
    try {
      await Promise.race([
        getDb().execute(sql`select 1`),
        new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), DB_TIMEOUT_MS)),
      ]);
      db = "ok";
    } catch (error) {
      db = error instanceof DatabaseNotConfiguredError ? "not_configured" : "error";
    }
  }

  let communityWrites = "unknown";
  if (env === "ok") {
    const status = getCommunityWriteStatus();
    communityWrites = status.writable ? status.mode : status.reason;
  }

  const ok = env === "ok" && db === "ok";
  return NextResponse.json(
    { ok, env, db, communityWrites, dataThrough: getDataThrough() },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  );
}
