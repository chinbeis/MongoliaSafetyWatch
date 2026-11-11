import { NextResponse } from "next/server";
import { apiError, retryAfter } from "@/lib/api-response";
import { getClientKey } from "@/lib/client-key";
import { createChallengeFor, getCommunityWriteStatus } from "@/lib/community-bot-check";
import { MINUTE_MS, rateLimit } from "@/lib/rate-limit";

/**
 * Tells the client whether pins can be created and which human check to show:
 * `{ readonly: true }`, `{ mode: "turnstile", siteKey }`, or a math challenge.
 */
export async function GET(request: Request) {
  try {
    const status = getCommunityWriteStatus();
    if (status.writable && status.mode === "math") {
      const limit = await rateLimit(`challenge:10m:${getClientKey(request)}`, 30, 10 * MINUTE_MS);
      if (!limit.allowed) {
        return apiError("rate_limited", 429, retryAfter(limit.retryAfterSeconds));
      }
    }
    return NextResponse.json(createChallengeFor(status), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Failed to issue community challenge:", error);
    return apiError("server_error", 500);
  }
}
