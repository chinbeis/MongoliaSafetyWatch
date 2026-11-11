import { describe, expect, it } from "vitest";
import { EnvError, parseServerEnv } from "./env";

const strong = "x".repeat(40);

describe("parseServerEnv", () => {
  it("falls back to development defaults outside production", () => {
    const env = parseServerEnv({}, { production: false });
    expect(env.communityCaptchaSecret.length).toBeGreaterThanOrEqual(32);
    expect(env.databaseUrl).toBeUndefined();
    expect(env.communityReportsReadonly).toBe(false);
  });

  it("throws in production when required secrets are missing", () => {
    expect(() => parseServerEnv({}, { production: true })).toThrow(EnvError);
  });

  it("rejects placeholder values in production", () => {
    expect(() =>
      parseServerEnv(
        {
          DATABASE_URL: "postgresql://u:p@h/db",
          COMMUNITY_CAPTCHA_SECRET: "dev-community-captcha-secret",
          RATE_LIMIT_SALT_SECRET: strong,
          ADMIN_TOKEN: strong,
        },
        { production: true }
      )
    ).toThrow(/placeholder/);
  });

  it("rejects short secrets in production", () => {
    expect(() =>
      parseServerEnv(
        {
          DATABASE_URL: "postgresql://u:p@h/db",
          COMMUNITY_CAPTCHA_SECRET: "short",
          RATE_LIMIT_SALT_SECRET: strong,
          ADMIN_TOKEN: strong,
        },
        { production: true }
      )
    ).toThrow(/32 characters/);
  });

  it("accepts a complete production env and normalises the database URL", () => {
    const env = parseServerEnv(
      {
        DATABASE_URL: "psql 'postgresql://u:p@h/db?sslmode=require'",
        COMMUNITY_CAPTCHA_SECRET: strong,
        RATE_LIMIT_SALT_SECRET: strong,
        ADMIN_TOKEN: strong,
        COMMUNITY_REPORTS_READONLY: "1",
      },
      { production: true }
    );
    expect(env.databaseUrl).toBe("postgresql://u:p@h/db?sslmode=require");
    expect(env.communityReportsReadonly).toBe(true);
  });
});
