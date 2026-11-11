import { test as base, expect, type Page } from "@playwright/test";

export const SAMPLE_REPORTS = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    category: "theft",
    latitude: 47.9178,
    longitude: 106.9167,
    radiusMeters: 500,
    createdAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    category: "suspicious_activity",
    latitude: 47.9201,
    longitude: 106.9345,
    radiusMeters: 750,
    createdAt: new Date(Date.now() - 20 * 86400_000).toISOString(),
  },
];

/** A blank map style so tests never depend on the public tile host. */
const BLANK_STYLE = {
  version: 8,
  sources: {},
  layers: [{ id: "bg", type: "background", paint: { "background-color": "#0b1220" } }],
};

export async function mockApis(page: Page) {
  const created: unknown[] = [];
  await page.route("**/tiles.openfreemap.org/**", (route) =>
    route.fulfill({ contentType: "application/json", body: JSON.stringify(BLANK_STYLE) })
  );
  await page.route("**/api/community-reports", async (route) => {
    if (route.request().method() === "POST") {
      const body = route.request().postDataJSON() as Record<string, unknown>;
      const report = {
        id: "33333333-3333-4333-8333-333333333333",
        category: body.category,
        latitude: 47.9188,
        longitude: 106.9173,
        radiusMeters: body.radiusMeters,
        createdAt: new Date().toISOString(),
      };
      created.push(body);
      return route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ report }) });
    }
    return route.fulfill({ contentType: "application/json", body: JSON.stringify({ reports: SAMPLE_REPORTS }) });
  });
  await page.route("**/api/community-reports/challenge", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ readonly: false, mode: "math", token: "test.token", prompt: "3 + 4 = ?" }),
    })
  );
  await page.route("**/api/community-reports/*/flag", (route) =>
    route.fulfill({ contentType: "application/json", body: JSON.stringify({ ok: true, hidden: false }) })
  );
  return { created };
}

/** Collects console errors and uncaught exceptions for the whole test. */
export const test = base.extend<{ consoleErrors: string[] }>({
  consoleErrors: async ({ page }, provide) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    await provide(errors);
  },
});

export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

export { expect };
