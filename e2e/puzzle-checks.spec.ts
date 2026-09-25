import { expect, test } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { PUZZLE_KIND_LIST, PUZZLE_SPECS } from "../src/lib/puzzles/puzzles.constants";
import { freshPuzzleSeed, ready } from "./support";

/**
 * A CHECK ALLOWANCE IS SPENT, AND RUNS OUT, ON EVERY KIND OF PUZZLE.
 *
 * John, 2026-09-24: "they only get 3 CHECKS, or 1 CHECK... or unlimited CHECKS.
 * That should be an option." Chosen on the set-up screen and carried in the
 * address, so the same link is the same puzzle under the same allowance.
 * Running out takes Check away and leaves the puzzle going.
 */
for (const kind of PUZZLE_KIND_LIST) {
  test(`${kind}: one check, spent, and then there are none`, async ({ page }) => {
    const size = PUZZLE_SPECS[kind].defaultSize;
    // A grid of its own: this leaves its puzzle unfinished, and an unfinished puzzle is kept.
    await page.goto(`/games/${PUZZLE_SLUGS[kind]}/play?size=${size}&level=easy&seed=${freshPuzzleSeed()}&checks=1`);
    await ready(page, "puzzle-play");
    const check = page.getByTestId("puzzle-check");
    await expect(check).toHaveAttribute("data-left", "1");
    await expect(check).toBeDisabled();

    // The clock starts on the first entry: a number in an empty cell, or a stone.
    if (kind === "hiddenStones") await page.getByTestId("puzzle-cell").first().click();
    else {
      await page.locator('[data-testid="puzzle-cell"][data-value=""]').first().click();
      await page.getByTestId("puzzle-key-1").click();
    }

    await expect(check).toBeEnabled();
    await expect(check).toContainText("1 left");
    await check.click();
    await expect(page.getByTestId("puzzle-checked")).toBeVisible();
    await expect(check).toHaveAttribute("data-left", "0");
    await expect(check).toBeDisabled();
    await expect(check).toHaveText("No checks left");
    // The puzzle goes on: nothing has ended it.
    await expect(page.getByTestId("puzzle-done")).toHaveCount(0);
    await expect(page.getByTestId("puzzle-grid")).toBeVisible();
  });
}

test("the set-up screen's Checks choice travels to the puzzle in its address", async ({ page }) => {
  await page.goto(`/games/${PUZZLE_SLUGS.numberPlace}/new`);
  await ready(page, "puzzle-set-up");
  const solve = page.getByTestId("puzzle-solve");
  await expect(solve).not.toHaveAttribute("href", /checks=/);
  await page.getByTestId("puzzle-checks-3").click();
  await expect(page.getByTestId("puzzle-checks-3")).toHaveAttribute("aria-checked", "true");
  await expect(solve).toHaveAttribute("href", /checks=3/);
  await solve.click();
  await ready(page, "puzzle-play");
  await expect(page).toHaveURL(/checks=3/);
  await expect(page.getByTestId("puzzle-check")).toHaveAttribute("data-left", "3");
});
