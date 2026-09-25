import { expect, test } from "@playwright/test";
import { openAdvanced, openSetup } from "./support";

/** Column letters as the board labels them, with "I" skipped as in go. */
const COLUMNS = "ABCDEFGHJKLMNOPQRSTUVWXYZ";
const cell = (row: number, col: number) => `${COLUMNS[col]}${11 - row}`;

/**
 * HEX FIVE: five in a row on the same hexagon of hexagons Honeycomb turns
 * discs on, read as a line game instead.
 *
 * One browser case, as the New Game Gate asks. The rule that is new is the
 * shape: unlike Honeycomb, the centre cell is playable, and a line runs
 * along only three of the six directions a hexagon cell touches. So the
 * check is that the centre takes a stone, and that a run along a real axis
 * (a row, which is one of the three) wins the game.
 */
test.describe("hex five", () => {
  test("opens with the centre playable, and wins on a line along a real axis", async ({ page }) => {
    await page.goto("/games/gomoku/play");
    await page.evaluate(() => window.localStorage.clear());
    await page.goto("/games/gomoku/play");
    await openAdvanced(page);
    await openSetup(page);
    await page.getByTestId("rules").selectOption("hexFive");
    await openSetup(page);

    // The eleven-square: 91 cells, none of them the sealed centre Honeycomb has.
    await expect(page.getByRole("button", { name: /empty$/ })).toHaveCount(91);
    await expect(page.getByRole("button", { name: new RegExp(`^${cell(5, 5)}, empty$`) })).toBeEnabled();

    // Row 6 (the middle row), columns D through H: a run of five along one of
    // the lattice's three real axes. White answers along the top edge, well
    // off the line.
    const blacks = [cell(5, 3), cell(5, 4), cell(5, 5), cell(5, 6), cell(5, 7)];
    const whites = [cell(0, 5), cell(0, 6), cell(0, 7), cell(0, 8)];
    for (let i = 0; i < blacks.length; i += 1) {
      await page.getByRole("button", { name: new RegExp(`^${blacks[i]}, empty$`) }).click();
      if (whites[i] !== undefined) {
        await page.getByRole("button", { name: new RegExp(`^${whites[i]}, empty$`) }).click();
      }
    }
    await expect(page.getByText(/wins in \d+ moves/)).toBeVisible();
  });
});
