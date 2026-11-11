import { NextResponse } from "next/server";
import { apiError, isUuid, readJson, retryAfter } from "@/lib/api-response";
import { getClientKey } from "@/lib/client-key";
import { checkHuman, getCommunityWriteStatus } from "@/lib/community-bot-check";
import { flagReport, flagReportSchema } from "@/lib/community-reports";
import { MINUTE_MS, rateLimit } from "@/lib/rate-limit";

const FLAG_LIMIT = { limit: 10, windowMs: 10 * MINUTE_MS };

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!isUuid(id)) {
      return apiError("invalid_id", 400);
    }

    const status = getCommunityWriteStatus();
    if (!status.writable) {
      return apiError("readonly", 503);
    }

    const clientKey = getClientKey(request);
    const limit = await rateLimit(`flag:10m:${clientKey}`, FLAG_LIMIT.limit, FLAG_LIMIT.windowMs);
    if (!limit.allowed) {
      return apiError("rate_limited", 429, retryAfter(limit.retryAfterSeconds));
    }

    const parsed = flagReportSchema.safeParse((await readJson(request)) ?? {});
    if (!parsed.success) {
      return apiError("invalid_body", 400);
    }

    const human = await checkHuman(status, parsed.data, "community-flag", { requireInMathMode: false });
    if (!human.ok) {
      return apiError(human.code, human.status);
    }

    const outcome = await flagReport(id.toLowerCase(), clientKey);
    if (!outcome.found) {
      return apiError("not_found", 404);
    }

    // Deliberately does not reveal the flag count.
    return NextResponse.json(
      { ok: true, hidden: outcome.status !== "visible" },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Failed to flag community report:", error);
    return apiError("server_error", 500);
  }
}
