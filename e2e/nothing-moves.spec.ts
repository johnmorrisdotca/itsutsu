import { expect, test, type Locator } from "@playwright/test";

import { playAt, ready } from "./support";

/**
 * NOTHING ON THE GAME PAGE MOVES WHILE THE RECORD IS STEPPED THROUGH.
 *
 * John, 2026-09-25: "Using the scrubber sucks when the content above the
 * scrubber changes height… Same with the board. We have the title above the
 * board sometimes and sometimes not… I HATE MOVING OBJECTS in the page." The
 * banner over the board is drawn at every position, and the status panel keeps
 * the height its notes take, so the board and the scrubber stay put.
 */
/** Where the element sits on the PAGE, not in the window: a press scrolls the window to what it presses. */
async function top(locator: Locator): Promise<number> {
  return Math.round(await locator.evaluate((element) => element.getBoundingClientRect().top + window.scrollY));
}

test("stepping back and forward leaves the board and the scrubber where they were", async ({ page }) => {
  await page.goto("/games/gomoku/play");
  await ready(page, "game-view");
  await page.getByRole("button", { name: "New game" }).click();
  for (const [row, col] of [
    [7, 7],
    [7, 8],
    [8, 8],
    [6, 6],
  ] as const) {
    await playAt(page, 15, row, col);
  }

  const corner = page.getByRole("button", { name: /^A1,/ });
  const scrubber = page.getByTestId("history-scrubber");
  await expect(page.getByTestId("review-banner")).toHaveAttribute("data-reviewing", "false");
  const [boardAt, scrubberAt] = [await top(corner), await top(scrubber)];

  // Back to the start, one step at a time, through every position.
  const record = page.getByTestId("move-history");
  await record.getByRole("button").first().click();
  await expect(page.getByTestId("review-banner")).toHaveAttribute("data-reviewing", "true");
  expect(await top(corner), "the board moved when reviewing began").toBe(boardAt);
  expect(await top(scrubber), "the scrubber moved when reviewing began").toBe(scrubberAt);

  await page.getByTestId("return-to-latest").click();
  await expect(page.getByTestId("review-banner")).toHaveAttribute("data-reviewing", "false");
  expect(await top(corner), "the board moved on the way back").toBe(boardAt);
  expect(await top(scrubber), "the scrubber moved on the way back").toBe(scrubberAt);
});
