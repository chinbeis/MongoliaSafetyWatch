import { expect, expectNoHorizontalScroll, mockApis, test } from "./fixtures";

test.beforeEach(async ({ page }) => {
  // Skip the first-visit explainer except in the test that checks it.
  await page.addInitScript(() => window.localStorage.setItem("community-map-explainer-v1", "1"));
});

test("first visit shows the explainer once", async ({ page, context }) => {
  await context.clearCookies();
  await page.addInitScript(() => window.localStorage.removeItem("community-map-explainer-v1"));
  await mockApis(page);
  await page.goto("/community-map");
  const dialog = page.getByRole("dialog", { name: "Иргэдийн зураг гэж юу вэ?" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Ойлголоо" }).click();
  await expect(dialog).toBeHidden();
});

test("place a pin, see it in the feed, flag it — at phone width", async ({ page, consoleErrors }) => {
  const { created } = await mockApis(page);
  await page.goto("/community-map");

  // Always-visible "not a reporting channel" notice that links to official channels.
  const notice = page.getByRole("link", { name: /Мэдээлэх суваг биш · Яаралтай үед 102/ });
  await expect(notice).toBeVisible();
  await expect(notice).toHaveAttribute("href", "/report");
  await expectNoHorizontalScroll(page);

  // Tap the map to select an area.
  const map = page.getByRole("region", { name: "Иргэдийн аноним тэмдэглэгээний газрын зураг" });
  await expect(map.locator("canvas")).toBeVisible();
  const box = (await map.boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.6);

  await expect(page.getByText("Ойролцоо бүс сонгогдлоо")).toBeVisible();
  // No coordinate readout anywhere.
  await expect(page.getByText(/\d{2}\.\d{4,}/)).toHaveCount(0);

  await page.getByLabel("Хариу").fill("7");
  await page.getByRole("button", { name: "Аноним тэмдэглэгээ хадгалах" }).click();
  await expect(page.getByText("Тэмдэглэгээ хадгалагдлаа", { exact: false })).toBeVisible();
  expect(created).toHaveLength(1);

  // The feed tab lists it and the flag action is reachable by touch.
  await page.getByRole("tab", { name: /Сүүлийн тэмдэглэгээ/ }).click();
  const flagButtons = page.getByRole("button", { name: "Зохисгүй гэж мэдэгдэх" });
  await expect(flagButtons.first()).toBeVisible();
  await flagButtons.first().click();
  const dialog = page.getByRole("dialog", { name: /зохисгүй гэж мэдэгдэх үү/ });
  await dialog.getByRole("button", { name: "Мэдэгдэх" }).click();
  await expect(page.getByText("Мэдэгдлийг хүлээн авлаа", { exact: false })).toBeVisible();

  await expectNoHorizontalScroll(page);
  await page.screenshot({ path: `test-results/community-map-${test.info().project.name}.png` });
  expect(consoleErrors).toEqual([]);
});

test("shows an error state with retry when loading fails", async ({ page }) => {
  await mockApis(page);
  await page.route("**/api/community-reports", (route) => route.fulfill({ status: 500, body: "{}" }));
  await page.goto("/community-map");
  await page.getByRole("tab", { name: /Сүүлийн тэмдэглэгээ/ }).click();
  await expect(page.getByText("Тэмдэглэгээг ачаалж чадсангүй.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Дахин оролдох" })).toBeVisible();
});
