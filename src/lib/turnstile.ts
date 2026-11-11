import "server-only";
import { z } from "zod";

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TIMEOUT_MS = 5000;

const responseSchema = z.object({
  success: z.boolean(),
  action: z.string().optional(),
  "error-codes": z.array(z.string()).optional(),
});

export type TurnstileResult =
  | { ok: true }
  | { ok: false; reason: "missing" | "invalid" | "unavailable" };

/**
 * Server-side Turnstile verification. Fails closed: if Cloudflare cannot be
 * reached within 5 s, the request is rejected with a "try again" message.
 *
 * The client IP is intentionally not forwarded (`remoteip` is optional) —
 * we share as little as possible with third parties.
 */
export async function verifyTurnstile(
  token: string | undefined,
  secret: string,
  expectedAction: string,
  fetchImpl: typeof fetch = fetch
): Promise<TurnstileResult> {
  if (!token) {
    return { ok: false, reason: "missing" };
  }

  let payload: unknown;
  try {
    const response = await fetchImpl(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      return { ok: false, reason: "unavailable" };
    }
    payload = await response.json();
  } catch {
    return { ok: false, reason: "unavailable" };
  }

  const parsed = responseSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, reason: "unavailable" };
  }
  if (!parsed.data.success) {
    return { ok: false, reason: "invalid" };
  }
  // Tokens are minted per action; a flag token must not be usable to create.
  if (parsed.data.action && parsed.data.action !== expectedAction) {
    return { ok: false, reason: "invalid" };
  }
  return { ok: true };
}
