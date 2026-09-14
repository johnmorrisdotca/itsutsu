import { expect, test } from "@playwright/test";

/** Column letters as the board labels them, with "I" skipped as in go. */
const COLUMNS = "ABCDEFGHJKLMNOPQRSTUVWXYZ";
const cell = (row: number, col: number) => `${COLUMNS[col]}${11 - row}`;

test.describe("hex", () => {
  test("is a rhombus where a cell touches six, and joining your two sides wins", async ({ page }) => {
    await page.goto("/games/hex/play");
    await page.evaluate(() => window.localStorage.clear());
    await page.goto("/games/hex/play");

    // Eleven a side.
    await expect(page.getByRole("button", { name: /empty$/ })).toHaveCount(121);

    // Black walks down a column while white answers along the far side.
    for (let row = 0; row < 10; row += 1) {
      await page.getByRole("button", { name: new RegExp(`^${cell(row, 5)}, empty$`) }).click();
      await expect(page.getByTestId("to-play")).toContainText("White");
      await page.getByRole("button", { name: new RegExp(`^${cell(row, 9)}, empty$`) }).click();
    }
    // Nothing yet: black is one cell short of the bottom.
    await expect(page.getByTestId("to-play")).toContainText("to play");

    await page.getByRole("button", { name: new RegExp(`^${cell(10, 5)}, empty$`) }).click();
    await expect(page.getByTestId("to-play")).toContainText("top and bottom are joined");
  });

  /*
   * The board is a triangular lattice with the stones on the crossings —
   * John's decision, from the wooden board he photographed: lines, not
   * honeycomb cells. So a stone must land where three drawn lines meet, and
   * this reads the lines the browser actually drew rather than the maths that
   * placed them: the row's rule is level, the column's leans, the short
   * diagonal leans the other way, and all three must pass through the middle
   * of the stone. In both colour schemes, since the lattice is drawn on the
   * board's own surface and the scheme must not move it.
   */
  for (const scheme of ["light", "dark"] as const) {
    test(`a stone lands where three lines meet, in the ${scheme} scheme`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto("/games/hex/play");
      await page.evaluate(() => window.localStorage.clear());
      await page.goto("/games/hex/play");

      await page.getByRole("button", { name: new RegExp(`^${cell(5, 5)}, empty$`) }).click();
      const stone = page.getByRole("button", { name: new RegExp(`^${cell(5, 5)}, Black stone$`) });
      await expect(stone).toBeVisible();
      const at = await stone.boundingBox();
      if (at === null) throw new Error("the stone has no box");
      const centre = { x: at.x + at.width / 2, y: at.y + at.height / 2 };

      // The lines through row 5, column 5, and the diagonal where row + col = 10.
      const row = await page.locator('svg line[data-line="h5"]').boundingBox();
      const column = await page.locator('svg line[data-line="v5"]').boundingBox();
      const diagonal = await page.locator('svg line[data-line="d10"]').boundingBox();
      if (row === null || column === null || diagonal === null) throw new Error("a line of the lattice is not drawn");

      // The row is level: one height for its whole length.
      expect(Math.abs(row.y + row.height / 2 - centre.y)).toBeLessThan(3);
      // The column leans right going down, so at the stone's height it is this far along.
      const columnX = column.x + ((centre.y - column.y) / column.height) * column.width;
      expect(Math.abs(columnX - centre.x)).toBeLessThan(3);
      // The short diagonal leans the other way.
      const diagonalX = diagonal.x + diagonal.width - ((centre.y - diagonal.y) / diagonal.height) * diagonal.width;
      expect(Math.abs(diagonalX - centre.x)).toBeLessThan(3);

      // And the stone itself is round: the cell leans, the stone leans back.
      const disc = await stone.locator("span.rounded-full").first().boundingBox();
      if (disc === null) throw new Error("the stone has no disc");
      expect(Math.abs(disc.width - disc.height)).toBeLessThan(1.5);
    });
  }

  test("its rules page says a draw is impossible, and it offers the swap", async ({ page }) => {
    await page.goto("/games/hex/rules");
    await expect(page.getByTestId("rules-page")).toContainText("draw is impossible");
    await expect(page.getByTestId("rules-page")).toContainText("six");
    await expect(page.getByTestId("rules-page")).toContainText("Swap");
  });
});
