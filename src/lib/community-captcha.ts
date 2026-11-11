import "server-only";
import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { getServerEnv } from "@/lib/env";

/**
 * Fallback human check used only when Cloudflare Turnstile is not configured
 * (local development). It is NOT a real bot barrier — anyone can script a sum —
 * so production requires Turnstile (see community-bot-check.ts).
 *
 * Tokens are HMAC-signed, expire after 10 minutes, and carry a random nonce so
 * the caller can enforce single use (consumeOnce in rate-limit.ts).
 */

export const CAPTCHA_TTL_MS = 1000 * 60 * 10;

const payloadSchema = z.object({
  left: z.number().int().min(0).max(20),
  right: z.number().int().min(0).max(20),
  issuedAt: z.number().int().positive(),
  nonce: z.string().min(16).max(64),
});

type CaptchaPayload = z.infer<typeof payloadSchema>;

export function createCaptchaChallenge(now = Date.now()) {
  const payload: CaptchaPayload = {
    left: randomInt(2, 10),
    right: randomInt(1, 9),
    issuedAt: now,
    nonce: randomBytes(16).toString("base64url"),
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");

  return {
    token: `${encodedPayload}.${sign(encodedPayload)}`,
    prompt: `${payload.left} + ${payload.right} = ?`,
  };
}

export type CaptchaVerification = { ok: true; nonce: string } | { ok: false };

export function verifyCaptchaToken(token: unknown, answer: unknown, now = Date.now()): CaptchaVerification {
  if (typeof token !== "string" || token.length > 1024) {
    return { ok: false };
  }
  if (typeof answer !== "number" || !Number.isInteger(answer)) {
    return { ok: false };
  }

  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return { ok: false };
  }
  const [encodedPayload, signature] = parts;

  const provided = Buffer.from(signature);
  const expected = Buffer.from(sign(encodedPayload));
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return { ok: false };
  }

  let decoded: unknown;
  try {
    decoded = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  } catch {
    return { ok: false };
  }

  const parsed = payloadSchema.safeParse(decoded);
  if (!parsed.success) {
    return { ok: false };
  }

  const payload = parsed.data;
  if (now - payload.issuedAt > CAPTCHA_TTL_MS || payload.issuedAt > now + 60_000) {
    return { ok: false };
  }
  if (payload.left + payload.right !== answer) {
    return { ok: false };
  }

  return { ok: true, nonce: payload.nonce };
}

function sign(value: string) {
  return createHmac("sha256", getServerEnv().communityCaptchaSecret).update(value).digest("base64url");
}
