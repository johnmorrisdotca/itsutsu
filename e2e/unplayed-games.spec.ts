import { expect, test } from "@playwright/test";

import { openSetup, playAt } from "./support";

/**
 * FIVE GAMES THAT HAD NO BROWSER TEST, each driven to the move that shows
 * its rule. The New Game Gate asked for one per game and nothing enforced
 * it, so Ring Drop, Hole Drop, Clear Drop and Wild Tic-tac-toe shipped with
 * none — found by grepping the specs for each game's name, which is what
 * `variants.coverage.test.ts` does now. The gate found a fifth the moment it
 * ran: Classic Reversi was NAMED by a spec, as a link on the About page, and
 * never driven.
 */
test.describe("the games that had no browser test", () => {
  test("ring drop: the left and right edges join, so four across the seam wins", async ({ page }) => {
    await page.goto("/games/gomoku/play");
    await openSetup(page);
    await page.getByTestId("rules").selectOption("ringDrop");
    // Black F1 G1 A1 B1 — a line only a cylinder holds; White stacks in column D.
    const size = 7;
    await playAt(page, size, 6, 5);
    await playAt(page, size, 6, 3);
    await playAt(page, size, 6, 6);
    await playAt(page, size, 5, 3);
    await playAt(page, size, 6, 0);
    await playAt(page, size, 4, 3);
    await playAt(page, size, 6, 1);
    await expect(page.getByTestId("to-play")).toContainText(/wins/);
    await expect(page.getByTestId("to-play")).toContainText("Black");
  });

  test("hole drop: one square is dead, and a stone dropped into its column skips it", async ({ page }) => {
    await page.goto("/games/gomoku/play");
    await openSetup(page);
    await page.getByTestId("rules").selectOption("holeDrop");
    const hole = page.getByRole("button", { name: /, blocked$/ });
    await expect(hole).toHaveCount(1);
    await expect(hole).toBeDisabled();
    // The hole's column and row, off its own name.
    const name = (await hole.getAttribute("aria-label"))!.split(",")[0]!;
    const col = "ABCDEFGHJKLMNOPQRSTUVWXYZ".indexOf(name[0]!);
    const row = 7 - Number(name.slice(1));
    // Drop into that column from the top: the stone lands somewhere in the column that is not the hole.
    await page.getByRole("button", { name: new RegExp(`^${name[0]}7, empty$`) }).click();
    const landed = page.getByRole("button", { name: new RegExp(`^${name[0]}\\d, Black stone$`) });
    await expect(landed).toHaveCount(1);
    await expect(landed).not.toHaveAttribute("aria-label", new RegExp(`^${name},`));
    expect(col).toBeGreaterThanOrEqual(0);
    expect(row).toBeGreaterThanOrEqual(0);
  });

  test("clear drop: a full bottom row vanishes", async ({ page }) => {
    await page.goto("/games/gomoku/play");
    await openSetup(page);
    await page.getByTestId("rules").selectOption("clearDrop");
    const size = 7;
    // Seven stones along the bottom, alternating: the seventh completes the row.
    for (let col = 0; col < 6; col += 1) await playAt(page, size, 6, col);
    await expect(page.getByRole("button", { name: /1, (Black|White) stone$/ })).toHaveCount(6);
    await playAt(page, size, 6, 6);
    // The row is gone, and nothing stood on it to drop.
    await expect(page.getByRole("button", { name: /1, (Black|White) stone$/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /, (Black|White) stone$/ })).toHaveCount(0);
  });

  test("wild tic-tac-toe: either mark may be placed, and three of either wins for whoever makes it", async ({ page }) => {
    await page.goto("/games/gomoku/play");
    await openSetup(page);
    await page.getByTestId("rules").selectOption("wildTicTacToe");
    const size = 3;
    // The second player lays BLACK too — allowed — and the first completes three blacks and wins.
    await page.getByTestId("place-black").click();
    await playAt(page, size, 0, 0);
    await page.getByTestId("place-black").click();
    await playAt(page, size, 0, 1);
    await page.getByTestId("place-black").click();
    await playAt(page, size, 0, 2);
    await expect(page.getByRole("button", { name: /, Black stone$/ })).toHaveCount(3);
    await expect(page.getByTestId("to-play")).toContainText(/wins/);
  });

  test("classic reversi: the board starts empty, and the first four discs fill the centre", async ({ page }) => {
    await page.goto("/games/gomoku/play");
    await openSetup(page);
    await page.getByTestId("rules").selectOption("classicReversi");
    // No discs set out, unlike Reversi's four.
    await expect(page.getByRole("button", { name: /, (Black|White) stone$/ })).toHaveCount(0);
    // A square outside the centre four cannot be played yet; one inside can.
    await expect(page.getByRole("button", { name: /^A1, empty$/ })).toBeDisabled();
    await expect(page.getByRole("button", { name: /^D4, empty$/ })).toBeEnabled();
    const size = 8;
    await playAt(page, size, 3, 3);
    await playAt(page, size, 3, 4);
    await playAt(page, size, 4, 4);
    await playAt(page, size, 4, 3);
    await expect(page.getByRole("button", { name: /, (Black|White) stone$/ })).toHaveCount(4);
    // The centre full, the game is Reversi: a bracketing move outside it is open now.
    await expect(page.getByRole("button", { name: /, empty$/ }).and(page.locator(":not([disabled])"))).not.toHaveCount(0);
  });
});
