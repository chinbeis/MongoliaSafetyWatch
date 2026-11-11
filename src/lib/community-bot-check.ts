import "server-only";
import { createCaptchaChallenge, verifyCaptchaToken } from "@/lib/community-captcha";
import { getServerEnv, isProductionRuntime } from "@/lib/env";
import { consumeOnce } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import type { ApiErrorCode } from "@/lib/translations";

export type BotCheckMode = "turnstile" | "math" | "unavailable";

export type CommunityWriteStatus =
  | { writable: true; mode: "turnstile"; siteKey: string }
  | { writable: true; mode: "math" }
  | { writable: false; reason: "readonly" | "no_bot_protection" };

/**
 * Whether the community map accepts writes right now, and with which human
 * check. Production without Turnstile keys is read-only (LAUNCH_PLAN §8.3):
 * the math check is only a development convenience.
 */
export function getCommunityWriteStatus(): CommunityWriteStatus {
  const env = getServerEnv();
  if (env.communityReportsReadonly) {
    return { writable: false, reason: "readonly" };
  }

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  if (env.turnstileSecretKey && siteKey) {
    return { writable: true, mode: "turnstile", siteKey };
  }

  if (isProductionRuntime()) {
    return { writable: false, reason: "no_bot_protection" };
  }
  return { writable: true, mode: "math" };
}

export function createChallengeFor(status: CommunityWriteStatus) {
  if (!status.writable) {
    return { readonly: true as const };
  }
  if (status.mode === "turnstile") {
    return { readonly: false as const, mode: "turnstile" as const, siteKey: status.siteKey };
  }
  return { readonly: false as const, mode: "math" as const, ...createCaptchaChallenge() };
}

export interface BotCheckInput {
  turnstileToken?: string;
  captchaToken?: string;
  captchaAnswer?: number;
}

export type BotCheckResult = { ok: true } | { ok: false; code: ApiErrorCode; status: number };

/**
 * Verifies the human check for a write. `action` scopes Turnstile tokens
 * ("create" tokens cannot be replayed against "flag"). In math mode the
 * token's nonce is consumed so each challenge works exactly once.
 */
export async function checkHuman(
  status: Extract<CommunityWriteStatus, { writable: true }>,
  input: BotCheckInput,
  action: "community-create" | "community-flag",
  options: { requireInMathMode: boolean }
): Promise<BotCheckResult> {
  if (status.mode === "turnstile") {
    const secret = getServerEnv().turnstileSecretKey;
    if (!secret) {
      return { ok: false, code: "bot_check_unavailable", status: 503 };
    }
    const result = await verifyTurnstile(input.turnstileToken, secret, action);
    if (result.ok) {
      return { ok: true };
    }
    return result.reason === "unavailable"
      ? { ok: false, code: "bot_check_unavailable", status: 503 }
      : { ok: false, code: "bot_check_failed", status: 400 };
  }

  if (!options.requireInMathMode) {
    return { ok: true };
  }

  const verification = verifyCaptchaToken(input.captchaToken, input.captchaAnswer);
  if (!verification.ok) {
    return { ok: false, code: "bot_check_failed", status: 400 };
  }
  const firstUse = await consumeOnce(`captcha:${verification.nonce}`);
  if (!firstUse) {
    return { ok: false, code: "bot_check_reused", status: 400 };
  }
  return { ok: true };
}
