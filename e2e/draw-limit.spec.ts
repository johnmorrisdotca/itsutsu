import { expect, test } from "@playwright/test";

import { openAdvanced, openSetup, playAt } from "./support";

/**
 * The length two players may agree to.
 *
 * A game given a length is drawn once that share of the board's points has
 * been played with nobody winning. What is checked here is what a player
 * would check: set it, play to it, and see the game called a draw with room
 * still on the board — and told that that is why.
 *
 * Misère Five, because it is the game the setting exists for: five in a row
 * loses, so neither side wants to build one, and two careful players can go
 * on until the board fills.
 */
test.describe("a game given a length", () => {
  /**
   * Fills every other row, left to right, and never makes a line.
   *
   * Colours alternate with the moves, so a row reads black, white, black and
   * holds no five of one colour. Skipping a row between them means no two
   * stones are ever vertically or diagonally adjacent, so no line can form
   * that way either — which is what lets the game reach its length instead of
   * ending on its own rules first.
   */
  async function fillAlternateRows(page: import("@playwright/test").Page, size: number, moves: number) {
    let played = 0;
    for (let row = 0; row < size && played < moves; row += 2) {
      for (let col = 0; col < size && played < moves; col += 1) {
        await playAt(page, size, row, col);
        played += 1;
      }
    }
    return played;
  }

  test("is drawn once it has run its share of the board, with room left", async ({ page }) => {
    test.slow();
    await page.goto("/games/misere-five/play");

    await openSetup(page);
    await page.getByTestId("board-size").selectOption("9");
    await openSetup(page);
    await openAdvanced(page);
    await page.getByTestId("draw-limit").selectOption("half");

    // 9×9 is eighty-one points; half of it, rounded down, is forty moves.
    const played = await fillAlternateRows(page, 9, 40);
    expect(played).toBe(40);

    // Drawn — and the status says which of the three kinds of draw it was.
    // "Both made a line at once" would be a different thing entirely.
    await expect(page.getByTestId("to-play")).toContainText("ran to the length");

    // The whole point of a length: it ended with the board unfinished.
    expect(await page.getByRole("button", { name: /, empty$/ }).count()).toBe(41);
  });

  test("is not offered for a game that cannot be drawn", async ({ page }) => {
    // Hex: a full board always joins one player's two sides, so there is no
    // position in which neither has won and no length to set.
    await page.goto("/games/hex/play");
    await openSetup(page);
    await openAdvanced(page);
    await expect(page.getByTestId("draw-limit")).toBeDisabled();
  });

  test("is not offered on a board too small to need one", async ({ page }) => {
    // Noughts and crosses is over in nine moves. Half the board is four, and
    // a game cut short after four moves is this setting misapplied.
    await page.goto("/games/tic-tac-toe/play");
    await openSetup(page);
    await openAdvanced(page);
    await expect(page.getByTestId("draw-limit")).toBeDisabled();
    await expect(page.getByText(/too small to need a length/)).toBeVisible();
  });
});
