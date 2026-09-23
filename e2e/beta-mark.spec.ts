import { expect, test } from "@playwright/test";

/**
 * The site says it is a beta where a newcomer looks first: in the home page's
 * hero and in every other page's header, with the footer's own word.
 */
test("the Beta mark is in the home page's hero and in the header of the other pages", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("header[data-chrome]").getByTestId("beta-mark")).toHaveText("Beta");

  await page.goto("/games");
  const mark = page.locator("header[data-chrome]").getByTestId("beta-mark");
  await expect(mark).toBeVisible();
  // Out of the masthead's flow: it must not push the bar onto a line of its own.
  const header = await page.locator("header[data-chrome]").boundingBox();
  const wordmark = await page.getByRole("link", { name: "Itsutsu home" }).boundingBox();
  expect(header!.height).toBeLessThan(wordmark!.height * 3);
});

test("a visitor with no invite sees it too", async ({ browser }) => {
  const stranger = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await stranger.newPage();
  await page.goto("/games");
  await expect(page.locator("header[data-chrome]").getByTestId("beta-mark")).toBeVisible();
  await stranger.close();
});
