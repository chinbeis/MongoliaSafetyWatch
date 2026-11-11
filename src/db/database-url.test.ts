import { describe, expect, it } from "vitest";
import { normalizeDatabaseUrl } from "./database-url";

describe("normalizeDatabaseUrl", () => {
  it("passes plain URLs through", () => {
    expect(normalizeDatabaseUrl("postgresql://u:p@h/db")).toBe("postgresql://u:p@h/db");
  });

  it("extracts the URL from a pasted psql command", () => {
    expect(normalizeDatabaseUrl("psql 'postgresql://u:p@h/db?sslmode=require'")).toBe(
      "postgresql://u:p@h/db?sslmode=require"
    );
    expect(normalizeDatabaseUrl('psql "postgres://u:p@h/db"')).toBe("postgres://u:p@h/db");
  });

  it("returns undefined for empty input", () => {
    expect(normalizeDatabaseUrl(undefined)).toBeUndefined();
    expect(normalizeDatabaseUrl("   ")).toBeUndefined();
  });
});
