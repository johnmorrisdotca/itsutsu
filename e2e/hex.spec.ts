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
   * A RHOMBUS OF HEXAGON CELLS, since 2026-09-22 — and that reverses a
   * decision of John's, which is why it is written here. The board was a
   * triangular lattice of lines with the stones on the crossings, from a
   * wooden board he photographed: "lines, not honeycomb cells". Then, with
   * the three lattice boards side by side, he asked why boards with the same
   * moves looked so different and whether the rhombus could "look more like
   * the centre image" — the honeycomb. So all three are cells now, and Hex
   * keeps its two coloured borders, which are its rules.
   *
   * What a stone must still do is sit in the middle of its cell: the drawn
   * hexagon and the drawn stone are two boxes kept over each other by the
   * same transform, and this reads both from the browser. A hexagon is
   * centrally symmetric, so the centre of its box under the shear is still
   * its centre. In both colour schemes, since the scheme must not move it.
   */
  for (const scheme of ["light", "dark"] as const) {
    test(`a stone lands in the middle of its cell, in the ${scheme} scheme`, async ({ page }) => {
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
      // The cell at row 5, column 5 of an eleven board is the 61st playable tile; the border tiles come before them.
      const hexagon = await page.locator('svg[data-lattice="rhombus"] polygon[data-cell]').nth(5 * 11 + 5).boundingBox();
      if (hexagon === null) throw new Error("the cell is not drawn");
      expect(Math.abs(hexagon.x + hexagon.width / 2 - centre.x)).toBeLessThan(3);
      expect(Math.abs(hexagon.y + hexagon.height / 2 - centre.y)).toBeLessThan(3);
      /*
       * And the border is a ring of tiles: eleven black across the top and
       * bottom, eleven white down each side, no corners — with the letters in
       * the top row and the numbers in the left column, where John asked for
       * them, and no strips outside the board saying them again.
       */
      await expect(page.locator('svg[data-lattice="rhombus"] [data-edge="black"]')).toHaveCount(22);
      await expect(page.locator('svg[data-lattice="rhombus"] [data-edge="white"]')).toHaveCount(22);
      // The coordinates are HTML over the tiles, in the same type as every board's strips: each name once per edge.
      await expect(page.locator('[data-testid="lattice-coordinates"] [data-coordinate="F"]')).toHaveCount(2);
      await expect(page.locator('[data-testid="lattice-coordinates"] [data-coordinate="6"]')).toHaveCount(2);
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
