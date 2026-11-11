import { NextResponse } from "next/server";
import { apiError, readJson, retryAfter } from "@/lib/api-response";
import { getClientKey } from "@/lib/client-key";
import { checkHuman, getCommunityWriteStatus } from "@/lib/community-bot-check";
import { createReportSchema, insertReport, listPublicReports } from "@/lib/community-reports";
import { isInsideMongoliaBounds } from "@/lib/geo-privacy";
import { reportAlert, reportError } from "@/lib/monitoring";
import { DAY_MS, HOUR_MS, MINUTE_MS, rateLimit } from "@/lib/rate-limit";

const CREATE_SHORT = { limit: 3, windowMs: 10 * MINUTE_MS };
const CREATE_DAILY = { limit: 10, windowMs: DAY_MS };
/** Site-wide circuit breaker: more than this many new pins per hour → 503. */
const GLOBAL_CREATE_PER_HOUR = 300;

export async function GET() {
  try {
    const reports = await listPublicReports();
    return NextResponse.json(
      { reports },
      { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } }
    );
  } catch (error) {
    reportError("community-reports.list", error);
    return apiError("server_error", 500);
  }
}

export async function POST(request: Request) {
  try {
    const status = getCommunityWriteStatus();
    if (!status.writable) {
      return apiError("readonly", 503);
    }

    const clientKey = getClientKey(request);
    const short = await rateLimit(`create:10m:${clientKey}`, CREATE_SHORT.limit, CREATE_SHORT.windowMs);
    if (!short.allowed) {
      return apiError("rate_limited", 429, retryAfter(short.retryAfterSeconds));
    }
    const daily = await rateLimit(`create:1d:${clientKey}`, CREATE_DAILY.limit, CREATE_DAILY.windowMs);
    if (!daily.allowed) {
      return apiError("rate_limited", 429, retryAfter(daily.retryAfterSeconds));
    }

    const parsed = createReportSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return apiError("invalid_body", 400);
    }
    const body = parsed.data;

    if (!isInsideMongoliaBounds(body.latitude, body.longitude)) {
      return apiError("out_of_bounds", 400);
    }

    const human = await checkHuman(status, body, "community-create", { requireInMathMode: true });
    if (!human.ok) {
      return apiError(human.code, human.status);
    }

    const breaker = await rateLimit("global:create:1h", GLOBAL_CREATE_PER_HOUR, HOUR_MS);
    if (!breaker.allowed) {
      if (breaker.count === GLOBAL_CREATE_PER_HOUR + 1) {
        reportAlert("Community pin circuit breaker tripped", { limitPerHour: GLOBAL_CREATE_PER_HOUR });
      }
      return apiError("busy", 503, retryAfter(breaker.retryAfterSeconds));
    }

    const report = await insertReport(body);
    return NextResponse.json({ report }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    reportError("community-reports.create", error);
    return apiError("server_error", 500);
  }
}
