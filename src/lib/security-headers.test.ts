import { describe, expect, it } from "vitest";
import { buildCsp, securityHeaders } from "./security-headers";

describe("content security policy", () => {
  const csp = buildCsp({ mapStyleUrl: "https://tiles.openfreemap.org/styles/dark", development: false });

  it("locks down framing, base URI, plugins and forms", () => {
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("form-action 'self'");
  });

  it("allows only what the maps and Turnstile need", () => {
    expect(csp).toContain("worker-src 'self' blob:");
    expect(csp).toMatch(/connect-src [^;]*https:\/\/tiles\.openfreemap\.org/);
    expect(csp).toMatch(/frame-src https:\/\/challenges\.cloudflare\.com/);
    expect(csp).not.toContain("unsafe-eval");
  });

  it("follows the configured basemap host", () => {
    const custom = buildCsp({ mapStyleUrl: "https://maps.example.mn/style.json", development: false });
    expect(custom).toContain("https://maps.example.mn");
    expect(custom).not.toContain("openfreemap");
  });

  it("can ship in report-only mode", () => {
    const headers = securityHeaders({ mapStyleUrl: "https://a.example/s", development: false, cspReportOnly: true });
    expect(headers.map((h) => h.key)).toContain("Content-Security-Policy-Report-Only");
    expect(headers.map((h) => h.key)).toContain("Strict-Transport-Security");
  });
});
