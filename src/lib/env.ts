import "server-only";
import { z } from "zod";
import { normalizeDatabaseUrl } from "@/db/database-url";

/**
 * Server-side environment, validated once on first use.
 *
 * - Production runtime: every required secret must be present, at least 32
 *   characters, and not one of the placeholder values from `.env.example`.
 *   A misconfigured deployment throws instead of silently running with a
 *   guessable secret.
 * - Development / test: missing secrets fall back to clearly-labelled
 *   insecure defaults so `pnpm dev` works without a `.env`.
 * - `next build`: never throws (the build must succeed without any env).
 */

const KNOWN_DEV_DEFAULTS = new Set([
  "dev-community-captcha-secret",
  "change-me-32-random-bytes",
  "change-me-long-random-string",
  "change-me",
  "changeme",
  "secret",
]);

const DEV_FALLBACK = "insecure-development-only-secret-do-not-use-in-production";

const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

const flag = z
  .string()
  .trim()
  .optional()
  .transform((value) => value === "1" || value === "true");

const rawSchema = z.object({
  DATABASE_URL: optionalString,
  COMMUNITY_CAPTCHA_SECRET: optionalString,
  RATE_LIMIT_SALT_SECRET: optionalString,
  ADMIN_TOKEN: optionalString,
  TURNSTILE_SECRET_KEY: optionalString,
  SENTRY_DSN: optionalString,
  COMMUNITY_REPORTS_READONLY: flag,
});

export type ServerEnv = {
  databaseUrl: string | undefined;
  communityCaptchaSecret: string;
  rateLimitSaltSecret: string;
  adminToken: string | undefined;
  turnstileSecretKey: string | undefined;
  sentryDsn: string | undefined;
  communityReportsReadonly: boolean;
};

export class EnvError extends Error {
  constructor(public readonly problems: string[]) {
    super(`Invalid server environment: ${problems.join("; ")}`);
    this.name = "EnvError";
  }
}

const REQUIRED_SECRETS = ["COMMUNITY_CAPTCHA_SECRET", "RATE_LIMIT_SALT_SECRET", "ADMIN_TOKEN"] as const;

export function parseServerEnv(
  source: Record<string, string | undefined>,
  mode: { production: boolean }
): ServerEnv {
  const raw = rawSchema.parse(source);
  const problems: string[] = [];

  if (mode.production) {
    for (const name of REQUIRED_SECRETS) {
      const value = raw[name];
      if (!value) {
        problems.push(`${name} is required`);
      } else if (KNOWN_DEV_DEFAULTS.has(value) || value === DEV_FALLBACK) {
        problems.push(`${name} still has a placeholder value`);
      } else if (value.length < 32) {
        problems.push(`${name} must be at least 32 characters`);
      }
    }
    if (!raw.DATABASE_URL) {
      problems.push("DATABASE_URL is required");
    }
  }

  if (problems.length > 0) {
    throw new EnvError(problems);
  }

  return {
    databaseUrl: normalizeDatabaseUrl(raw.DATABASE_URL),
    communityCaptchaSecret: raw.COMMUNITY_CAPTCHA_SECRET ?? DEV_FALLBACK,
    rateLimitSaltSecret: raw.RATE_LIMIT_SALT_SECRET ?? DEV_FALLBACK,
    adminToken: raw.ADMIN_TOKEN,
    turnstileSecretKey: raw.TURNSTILE_SECRET_KEY,
    sentryDsn: raw.SENTRY_DSN,
    communityReportsReadonly: raw.COMMUNITY_REPORTS_READONLY,
  };
}

let cached: ServerEnv | null = null;

function isProductionRuntime() {
  return process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build";
}

export function getServerEnv(): ServerEnv {
  if (!cached) {
    cached = parseServerEnv(process.env, { production: isProductionRuntime() });
  }
  return cached;
}

/** Test helper: forget the cached env so the next call re-reads process.env. */
export function resetServerEnvForTests() {
  cached = null;
}
