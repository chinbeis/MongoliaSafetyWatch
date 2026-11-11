import { expect, test } from "./fixtures";

/**
 * Loads the map pages against the REAL basemap host (no tile mocking) and
 * fails on any Content-Security-Policy violation. Opt-in because it needs
 * the network: E2E_LIVE=1 pnpm test:e2e e2e/csp-live.spec.ts
 * (add E2E_BASE_URL=https://<preview> to check a deployment).
 */
test.skip(!process.env.E2E_LIVE, "set E2E_LIVE=1 to run against live map tiles");

for (const path of ["/map", "/community-map", "/stats", "/"]) {
  test(`no CSP violations on ${path}`, async ({ page }) => {
    const violations: string[] = [];
    page.on("console", (message) => {
      if (/Content Security Policy|Refused to/i.test(message.text())) violations.push(message.text());
    });
    await page.addInitScript(() => {
      window.localStorage.setItem("community-map-explainer-v1", "1");
      document.addEventListener("securitypolicyviolation", (event) => {
        console.error(`Refused to load ${event.blockedURI} (${event.violatedDirective})`);
      });
    });
    await page.goto(path);
    // Live tile streams never go fully idle; give the map time to load tiles.
    await page.waitForLoadState("load");
    await page.waitForTimeout(5000);
    expect(violations).toEqual([]);
  });
}
