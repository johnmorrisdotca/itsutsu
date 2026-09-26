import { expect, test, type Locator } from "@playwright/test";

import { ready } from "./support";

/**
 * A PUZZLE'S OWN SET-UP SCREEN SHOWS ITS BOARD, AS A GAME'S DOES.
 *
 * John, 2026-09-25: "Board Game Setup pages look a little different from other
 * games... we aren't showing the Preview Board. Show the Preview Board too. And
 * the Board colour options." A game's set-up draws the live board with its
 * sizes beside it and, for a Reversi, the colour patches under it; a puzzle's
 * drew the sizes and the options and no board at all.
 *
 * So: the preview is there, it is the puzzle at the size chosen, it stays one
 * box whatever size or level is pressed, and where the puzzle is drawn on the
 * board itself (Gomoji) the board's colour is chosen under it, on square
 * patches. A puzzle written on paper (Number Place) has no colour to choose.
 */

/** Where a thing stands on the page, not in the window: pressing a level lower down scrolls the window. */
async function box(locator: Locator) {
  return locator.evaluate((element) => {
    const at = element.getBoundingClientRect();
    return { top: Math.round(at.top + window.scrollY), width: Math.round(at.width), height: Math.round(at.height) };
  });
}

test("a Gomoji set-up shows its live board, its board colours, and does not move", async ({ page }) => {
  await page.goto("/games/gomoji-mot/new");
  await ready(page, "puzzle-set-up");
  const preview = page.getByTestId("set-up-puzzle-preview");
  await expect(preview).toHaveAttribute("data-kind", "gomojiMot");
  await expect(preview).toHaveAttribute("data-size", "5");
  // The board the solve draws, with nothing typed on it.
  await expect(preview.getByTestId("puzzle-grid")).toHaveAttribute("data-size", "5");
  await expect(preview.getByTestId("word-tile").first()).toHaveAttribute("data-mark", "empty");

  // The colours under it: square patches, each a press.
  const patches = preview.getByTestId("felt-patches");
  await expect(patches.getByRole("radio")).toHaveCount(5);
  const look = await patches.getByTestId("felt-blue").evaluate((patch) => {
    const style = getComputedStyle(patch);
    const at = patch.getBoundingClientRect();
    return { width: at.width, height: at.height, radius: parseFloat(style.borderTopLeftRadius), cursor: style.cursor };
  });
  expect(Math.abs(look.width - look.height)).toBeLessThanOrEqual(1);
  expect(look.radius).toBeLessThanOrEqual(look.width / 4);
  expect(look.cursor).toBe("pointer");
  await patches.getByTestId("felt-blue").click();
  await expect(patches.getByTestId("felt-blue")).toHaveAttribute("aria-checked", "true");

  // Another size and another level redraw the board in the same box, and move nothing under it.
  const before = await box(preview);
  const options = await box(page.getByTestId("puzzle-settings"));
  await page.locator('[data-testid="set-up-size"][data-size="4"]').click();
  await expect(preview).toHaveAttribute("data-size", "4");
  await expect(preview.getByTestId("puzzle-grid")).toHaveAttribute("data-size", "4");
  const rowsAtMedium = await preview.locator('[data-testid="word-tile"]').count();
  await page.getByTestId("puzzle-level-easy").click();
  await expect(page.getByTestId("puzzle-level-easy")).toHaveAttribute("aria-checked", "true");
  // Easy gives every row of the board: more rows than medium, drawn on the same board.
  await expect.poll(() => preview.locator('[data-testid="word-tile"]').count()).toBeGreaterThan(rowsAtMedium);
  expect(await box(preview)).toEqual(before);
  expect(await box(page.getByTestId("puzzle-settings"))).toEqual(options);
});

test("a Number Place set-up shows its live grid and no board colours", async ({ page }) => {
  await page.goto("/games/number-place/new");
  await ready(page, "puzzle-set-up");
  const preview = page.getByTestId("set-up-puzzle-preview");
  await expect(preview).toHaveAttribute("data-kind", "numberPlace");
  await expect(preview.getByTestId("puzzle-preview-grid")).toBeVisible();
  // Asked once the grid is drawn, so its absence is a statement about a rendered page.
  await expect(page.getByTestId("felt-patches")).toHaveCount(0);
  const before = await box(preview);
  await page.locator('[data-testid="set-up-size"][data-size="4"]').click();
  await expect(preview).toHaveAttribute("data-size", "4");
  expect(await box(preview)).toEqual(before);
});
