import { expect, test, type Page } from "@playwright/test";

import { openSetUpPage, ready } from "./support";

/**
 * A GAME ON TWO SHELVES IS ONE GAME.
 *
 * John, 2026-09-15: Small boards held Tic-tac-toe and no small Reversi, though
 * one would belong there just as much — "a family is a way of finding a game,
 * not a filing cabinet". So Mini Reversi lives under Flips and is listed under
 * Small boards too (`ALSO_LISTED_IN`). Picked from either shelf it has to be the
 * same game: the same address on the page before it.
 *
 * Driven by clicking, the way a reader browses the set-up page — a family, then
 * the game, then Start — and back again by the doorstep's own Change button.
 * Nothing reloads, and nobody presses Begin, so no game is written.
 */

const GAME = "miniReversi";

/** Opens a family, picks Mini Reversi from its shelf, presses Start, and says where that led. */
async function pickFrom(page: Page, family: string, note: string | null): Promise<string> {
  const tile = page.locator(`[data-testid="set-up-family"][data-family="${family}"]`);
  await tile.click();
  await expect(tile).toHaveAttribute("data-open", "true");

  const chip = page.getByTestId("set-up-family-games").locator(`[data-testid="set-up-variant"][data-variant="${GAME}"]`);
  await chip.click();
  await expect(chip).toHaveAttribute("data-chosen", "true");
  // Choosing it does not move the reader off the shelf they found it on.
  await expect(tile).toHaveAttribute("data-open", "true");

  if (note === null) {
    // At home it says nothing about elsewhere — asked only now that the chip is known to be drawn.
    await expect(chip.getByTestId("set-up-variant-home")).toHaveCount(0);
  } else {
    await expect(chip.getByTestId("set-up-variant-home")).toHaveText(note);
  }

  await page.getByTestId("set-up-start").click();
  await ready(page, "doorstep");
  return new URL(page.url()).pathname;
}

test.describe("a game listed on two shelves", () => {
  test("Mini Reversi picked from Small boards is the same game as Mini Reversi picked from Flips", async ({ page }) => {
    await openSetUpPage(page);

    const fromSmallBoards = await pickFrom(page, "Small boards", "also under Flips");
    expect(fromSmallBoards).toBe("/games/mini-reversi/begin");

    // The way back, by the doorstep's own button, and the same game from its home.
    await page.getByTestId("doorstep-change").click();
    await ready(page, "set-up-game");
    const fromFlips = await pickFrom(page, "Flips", null);
    expect(fromFlips).toBe(fromSmallBoards);
  });
});
