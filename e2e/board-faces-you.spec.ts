import { expect, test } from "@playwright/test";

/**
 * The board is drawn from your side of it.
 *
 * John opened Halma and said it felt backwards, and it was: his camp was the
 * far corner. Every board was drawn the same way round for everybody, so in
 * any game that sets men out before the first move one of the two players was
 * always looking at it from behind.
 *
 * This measures where the men actually land on the screen rather than asking
 * the rule what it thinks, because the rule and the drawing are two different
 * pieces of code and it is the drawing John was complaining about.
 */
test.describe("a board that sets men out", () => {
  test("starts with your own men nearest you", async ({ page }) => {
    await page.goto("/games/halma/play");
    const board = page.locator("button[aria-label*='black' i]").first();
    await expect(board).toBeVisible();

    const seats = await page.evaluate(() => {
      const cells = Array.from(document.querySelectorAll("button[aria-label]"));
      const mine: number[] = [];
      const theirs: number[] = [];
      let top = Infinity;
      let bottom = -Infinity;
      for (const cell of cells) {
        const label = (cell.getAttribute("aria-label") ?? "").toLowerCase();
        const box = cell.getBoundingClientRect();
        if (box.width === 0) continue;
        top = Math.min(top, box.top);
        bottom = Math.max(bottom, box.bottom);
        if (label.includes("black")) mine.push(box.top);
        else if (label.includes("white")) theirs.push(box.top);
      }
      const middle = (top + bottom) / 2;
      const mean = (rows: number[]) => rows.reduce((a, b) => a + b, 0) / rows.length;
      return { mine: mean(mine), theirs: mean(theirs), middle, count: mine.length };
    });

    expect(seats.count, "no black men were drawn at all").toBeGreaterThan(4);
    // The opener's camp is the near one, and the opponent's is the far one.
    expect(seats.mine, "black's camp is drawn on the far side").toBeGreaterThan(seats.middle);
    expect(seats.theirs, "white's camp is drawn on the near side").toBeLessThan(seats.middle);
  });

  test("leaves a board that starts empty exactly as it was", async ({ page }) => {
    // Gomoku has no sides before anybody plays, so nothing should have moved.
    // The coordinates are the tell: turning the board turns them with it.
    await page.goto("/games/gomoku/play");
    const first = page.locator("button[aria-label]").first();
    await expect(first).toBeVisible();
    await expect(first).toHaveAttribute("aria-label", /^A15/);
  });
});
