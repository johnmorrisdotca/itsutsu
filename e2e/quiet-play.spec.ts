import { expect, test } from "@playwright/test";

import { ready } from "./support";

/**
 * QUIET WHILE PLAYING (`PlayingNow`). John, 2026-09-30: "minimal distractions
 * [while playing] a game … For all games." While a game is being played the
 * site's sections, New game, the member's figures, the table's title and the
 * footer go; the wordmark, the account and the trail back stay. The set-up
 * before it and the finished table after it show everything, as every page
 * without a game on it does.
 *
 * Driven on Dots and Boxes, a table kept in this browser, from its set-up by
 * pressing Start, as a table would. Nothing here writes to the database. The
 * rule is held for every other play by `quietPlay.coverage.test.ts`.
 */

const KEPT = "itsutsu.dotsAndBoxes";

test("the site steps back while a game is played, and comes back for the set-up and the finished table", async ({ page }) => {
  await page.goto("/games/dots-and-boxes");
  await page.evaluate((key) => window.localStorage.removeItem(key), KEPT);

  // The set-up: nothing is being played yet, so the whole site is there.
  await page.goto("/games/dots-and-boxes/pass-and-play");
  await ready(page, "dots-set-up");
  await expect(page.getByTestId("nav-new-game")).toBeVisible();
  await expect(page.getByTestId("site-footer")).toBeVisible();
  await expect(page.getByTestId("playing-now")).toHaveCount(0);

  await page.locator('[data-testid="dots-count"][data-count="2"]').click();
  await page.locator('[data-testid="dots-size"][data-size="3"]').click();
  await page.getByTestId("dots-start").click();
  await expect(page.getByTestId("dots-game")).toHaveAttribute("data-state", "playing");

  // Playing: the sections, New game and the footer go; the way home, the account and the way back stay.
  await expect(page.getByTestId("playing-now")).toHaveCount(1);
  await expect(page.getByTestId("nav-new-game")).toBeHidden();
  await expect(page.getByTestId("site-footer")).toBeHidden();
  await expect(page.getByRole("link", { name: "Itsutsu home" })).toBeVisible();
  await expect(page.getByTestId("account-slot")).toBeVisible();
  await expect(page.getByTestId("game-trail")).toBeVisible();

  // To the end, line by line, and the site comes back around the finished table.
  while ((await page.getByTestId("dots-game").getAttribute("data-state")) === "playing") {
    const drawn = Number(await page.getByTestId("dots-game").getAttribute("data-lines"));
    await page.getByTestId("dots-line").first().click();
    await expect(page.getByTestId("dots-game")).not.toHaveAttribute("data-lines", String(drawn));
  }
  await expect(page.getByTestId("dots-game")).toHaveAttribute("data-state", "finished");
  await expect(page.getByTestId("playing-now")).toHaveCount(0);
  await expect(page.getByTestId("nav-new-game")).toBeVisible();
  await expect(page.getByTestId("site-footer")).toBeVisible();

  // And a page with no board keeps its navigation whatever was played before it.
  await page.goto("/games");
  await expect(page.getByTestId("nav-new-game")).toBeVisible();
  await page.evaluate((key) => window.localStorage.removeItem(key), KEPT);
});
