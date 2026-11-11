import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { apiError, retryAfter } from "@/lib/api-response";
import { getClientKey } from "@/lib/client-key";
import { getServerEnv } from "@/lib/env";
import { MINUTE_MS, isRateLimited, rateLimit } from "@/lib/rate-limit";

const FAILED_ATTEMPTS = { limit: 5, windowMs: 15 * MINUTE_MS };

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

/** Constant-time comparison that does not leak the length of the secret. */
export function tokensMatch(provided: string, expected: string) {
  return timingSafeEqual(digest(provided), digest(expected));
}

/**
 * Returns an error response when the request is not an authorised admin
 * request, or null when it is. The token itself is never logged.
 *
 * - ADMIN_TOKEN unset → 404 (the admin API does not exist).
 * - More than 5 failed attempts from a client in 15 minutes → 429.
 */
export async function requireAdmin(request: Request): Promise<NextResponse | null> {
  const { adminToken } = getServerEnv();
  if (!adminToken) {
    return new NextResponse(null, { status: 404 });
  }

  const failKey = `admin-fail:15m:${getClientKey(request)}`;
  if (await isRateLimited(failKey, FAILED_ATTEMPTS.limit, FAILED_ATTEMPTS.windowMs)) {
    return apiError("rate_limited", 429, retryAfter(FAILED_ATTEMPTS.windowMs / 1000));
  }

  const header = request.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";
  if (provided && tokensMatch(provided, adminToken)) {
    return null;
  }

  await rateLimit(failKey, FAILED_ATTEMPTS.limit, FAILED_ATTEMPTS.windowMs);
  return apiError("unauthorized", 401);
}
