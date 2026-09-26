import { expect, test } from "@playwright/test";

import { aComputerOpponent, chooseOpponent, openSetUpPage, startAndBegin } from "./support";
import { gamesMade } from "./tidy";

/** Every game this file begins, taken away when it finishes. */
const tidyAway = gamesMade();

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
  /*
   * IN A LIVE GAME. The practice board used to be turned for the opener too,
   * which is where John's Halma complaint was made — and then, with three
   * boards side by side, he found A1 top-right on one and bottom-left on the
   * next and asked for one standard. A practice board has nobody sitting at
   * it, so it is drawn the way a chess or go diagram is; a live game faces
   * the player in the seat, which is what this case drives now.
   */
  test("starts with your own men nearest you", async ({ page }) => {
    await openSetUpPage(page, "halma");
    const computer = await aComputerOpponent(page, 0);
    await chooseOpponent(page, computer);
    await startAndBegin(page);
    await page.waitForURL(/\/games\/halma\/match\//, { timeout: 30_000 });
    tidyAway(/match\/([^/?#]+)/.exec(page.url())?.[1] ?? "");
    const board = page.locator("button[aria-label*='black' i]").first();
    await expect(board).toBeVisible();

    const seats = await page.evaluate(() => {
      // The board's own cells: a live match page has labelled buttons below the board too, which would drag the middle down.
      const cells = Array.from(document.querySelectorAll(".aspect-square button[aria-label]"));
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

  test("draws the practice board the standard way, A1 at the bottom left, whatever the game sets out", async ({ page }) => {
    for (const slug of ["halma", "chinese-checkers", "checkers"]) {
      await page.goto(`/games/${slug}/play`);
      const first = page.locator(".aspect-square button[aria-label]").first();
      await expect(first).toBeVisible();
      // The first cell in the array is the top-left one, and it is named A<size>: A1 is at the bottom left.
      await expect(first, `${slug} is drawn turned round on the practice board`).toHaveAttribute("aria-label", /^A\d+/);
    }
  });

  test("leaves a board that starts empty exactly as it was", async ({ page }) => {
    // Gomoku has no sides before anybody plays, so nothing should have moved.
    // The coordinates are the tell: turning the board turns them with it.
    await page.goto("/games/gomoku/play");
    const first = page.locator(".aspect-square button[aria-label]").first();
    await expect(first).toBeVisible();
    await expect(first).toHaveAttribute("aria-label", /^A15/);
  });
});
