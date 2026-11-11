import { expect, expectNoHorizontalScroll, mockApis, test } from "./fixtures";

const PAGES = ["/", "/map", "/stats", "/community-map", "/report"];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("community-map-explainer-v1", "1"));
  await mockApis(page);
});

for (const path of PAGES) {
  test(`${path} loads cleanly on a phone`, async ({ page, consoleErrors }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator("main")).toBeVisible();
    await page.waitForLoadState("networkidle");
    await expectNoHorizontalScroll(page);
    await page.screenshot({ path: `test-results/smoke${path === "/" ? "-home" : path.replace("/", "-")}-${test.info().project.name}.png`, fullPage: false });
    expect(consoleErrors).toEqual([]);
  });
}

test("/map uses rates, not risk labels", async ({ page }) => {
  await page.goto("/map");
  await expect(page.getByText("10 000 хүнд ногдох").first()).toBeVisible();
  const text = await page.locator("body").innerText();
  expect(text).not.toMatch(/эрсдэл/i);
});

test("home shows data-as-of figures and no live indicator", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Сүүлийн мэдээлэл \(\d{4}-\d{2} байдлаар\)/ })).toBeVisible();
  await expect(page.locator(".live-dot")).toHaveCount(0);
});
