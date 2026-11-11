import "server-only";
import { createHmac } from "node:crypto";
import { getServerEnv } from "@/lib/env";

/**
 * The client IP as reported by the hosting platform.
 *
 * On Vercel, `x-vercel-forwarded-for` / `x-real-ip` / `x-forwarded-for` are
 * all set by the edge and client-supplied values are overwritten
 * (https://vercel.com/docs/headers/request-headers). `x-vercel-forwarded-for`
 * is preferred because it survives a proxy placed in front of Vercel.
 * Off Vercel (local dev, tests) the headers are not trustworthy, which is fine
 * because nothing there needs abuse protection.
 */
export function getClientIp(request: Request): string {
  const headers = request.headers;
  const candidates = [
    headers.get("x-vercel-forwarded-for"),
    headers.get("x-real-ip"),
    headers.get("x-forwarded-for"),
  ];
  for (const value of candidates) {
    const first = value?.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }
  return "unknown";
}

export function utcDateStamp(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

/**
 * A non-reversible, daily-rotating identifier for a client:
 * HMAC_SHA256(ip, RATE_LIMIT_SALT_SECRET + UTC date).
 *
 * The raw IP is never stored. Because the salt includes the date, keys from
 * different days cannot be linked to each other, and once a day has passed
 * a key cannot be tested against a guessed IP without the secret.
 */
export function getClientKey(request: Request, now = new Date()): string {
  const { rateLimitSaltSecret } = getServerEnv();
  return createHmac("sha256", `${rateLimitSaltSecret}${utcDateStamp(now)}`)
    .update(getClientIp(request))
    .digest("base64url");
}
