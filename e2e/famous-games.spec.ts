import { expect, test } from "@playwright/test";

import { readyHere } from "./support";

/**
 * The famous games: reached from the games page, each card a championship
 * game with its record's source named. Its small picture opens the picture of
 * every position in a window — made in the browser, the site asked for
 * nothing — and Esc brings the page back. Its moves are stepped through with a
 * finished game's scrubber and list.
 */
const FINAL = '[data-testid="famous-game"][data-id="alphago-leesedol-4"]';

test("the famous games are reached from the games page, and a small picture opens every position in a window without asking the site", async ({ page }) => {
  await page.goto("/games");
  await page.getByTestId("tabs").locator('[data-testid="tab"][data-tab="famous"]').click();
  await expect(page).toHaveURL(/\/famous$/);

  const final = page.locator(FINAL);
  await expect(final).toContainText("Lee Sedol");
  await expect(final).toContainText("Google DeepMind Challenge Match");
  await expect(final.getByRole("link", { name: /Brouwer/ })).toHaveAttribute("href", /cwi\.nl/);
  const open = final.getByTestId("open-mosaic");
  await readyHere(open);
  // The small picture carries its expand icon, and nothing is drawn inline under the card any more.
  await expect(open.getByTestId("mosaic-expand-icon")).toBeVisible();
  await expect(final.getByTestId("mosaic-picture")).toHaveCount(0);

  const asked: string[] = [];
  page.on("request", (sent) => {
    if (!sent.url().startsWith("http")) return;
    const path = new URL(sent.url()).pathname;
    if (!path.startsWith("/_next/")) asked.push(path);
  });
  await open.click();
  const dialog = page.getByTestId("mosaic-dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByTestId("mosaic-picture")).toBeVisible();
  expect(asked, "making the picture asked the site for something").toEqual([]);

  const download = page.waitForEvent("download");
  await dialog.getByTestId("download-mosaic").click();
  expect((await download).suggestedFilename()).toBe("itsutsu-famous-alphago-leesedol-4.png");

  // Esc returns to the page, as Close does.
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await open.click();
  await page.getByTestId("close-mosaic").click();
  await expect(page.getByTestId("mosaic-dialog")).toHaveCount(0);
});

test("a famous game's moves are stepped through with the scrubber and the list", async ({ page }) => {
  await page.goto("/famous");
  const final = page.locator(FINAL);
  await readyHere(final.getByTestId("famous-replay"));
  await final.getByTestId("famous-replay-open").click();

  // It opens at the end, where the card's small picture leaves off.
  const at = final.getByTestId("famous-replay-at");
  const moves = final.getByTestId("played-move");
  const count = await moves.count();
  expect(count).toBeGreaterThan(100);
  await expect(at).toContainText(`Move ${count} of ${count}`);

  await final.getByTestId("famous-start").click();
  await expect(at).toContainText(`Move 0 of ${count}`);
  await final.getByTestId("famous-forward").click();
  await expect(at).toContainText("Move 1 of");
  await expect(final.getByTestId("famous-scrubber")).toHaveValue("1");

  // A move in the list is a place to go.
  await moves.nth(77).click();
  await expect(at).toContainText(`Move 78 of ${count}`);
  await expect(final.getByTestId("famous-scrubber")).toHaveValue("78");

  await final.getByTestId("famous-replay-close").click();
  await expect(final.getByTestId("famous-replay-open")).toBeVisible();
});
