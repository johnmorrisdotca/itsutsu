import { expect, test } from "@playwright/test";

import { readyHere } from "./support";

/**
 * The famous games: reached from the games page, each card a championship
 * game with its record's source named, and each one made into a picture of
 * every position in the browser — the site asked for nothing while it is made.
 */
test("the famous games are reached from the games page, and a title-match game becomes a picture without asking the site", async ({ page }) => {
  await page.goto("/games");
  await page.getByTestId("tabs").locator('[data-testid="tab"][data-tab="famous"]').click();
  await expect(page).toHaveURL(/\/famous$/);

  const final = page.locator('[data-testid="famous-game"][data-id="alphago-leesedol-4"]');
  await expect(final).toContainText("Lee Sedol");
  await expect(final).toContainText("Google DeepMind Challenge Match");
  await expect(final.getByRole("link", { name: /Brouwer/ })).toHaveAttribute("href", /cwi\.nl/);
  await readyHere(final.getByTestId("famous-mosaic"));

  const asked: string[] = [];
  page.on("request", (sent) => {
    if (!sent.url().startsWith("http")) return;
    const path = new URL(sent.url()).pathname;
    if (!path.startsWith("/_next/")) asked.push(path);
  });
  await final.getByTestId("make-mosaic").click();
  await expect(final.getByTestId("mosaic-picture")).toBeVisible();
  expect(asked, "making the picture asked the site for something").toEqual([]);

  const download = page.waitForEvent("download");
  await final.getByTestId("download-mosaic").click();
  expect((await download).suggestedFilename()).toBe("itsutsu-famous-alphago-leesedol-4.png");
});
