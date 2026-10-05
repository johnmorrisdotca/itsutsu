import { expect, test } from "@playwright/test";

import { price } from "../src/lib/points/ladder";
import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generateNumberPlace } from "../src/lib/puzzles/numberPlace/generate";
import { decodeCells } from "../src/lib/puzzles/puzzleCode";
import { memberContext, memberIdFor, removeMember } from "./members";
import { freshPuzzleSeed, ready } from "./support";

/**
 * A PUZZLE'S IP IS ITS PRICE ON THE LADDER (`src/lib/points/ladder.ts`), not
 * its own score: a member of this file's own solves a 4x4 Number Place at Easy,
 * the smallest and easiest offering of a puzzle, with no help, and the site's
 * board, their page and the strip under the masthead all say 50, the price,
 * though the puzzle's own board scores the solve at five a blank cell.
 */
test("a solve is paid its ladder price in IP, on the board and the member's page", async ({ browser, baseURL }) => {
  const stamp = Date.now().toString(36);
  const member = { email: `puzzleip-${stamp}@example.test`, name: `Puzzleip ${stamp}` };
  const context = await memberContext(browser, baseURL!, member);
  try {
    const page = await context.newPage();
    const seed = freshPuzzleSeed();
    const puzzle = generateNumberPlace(4, "easy", seed);
    const givens = decodeCells(puzzle.givens, 4)!;
    const solution = decodeCells(puzzle.solution, 4)!;
    await page.goto(`/games/${PUZZLE_SLUGS.numberPlace}/play?size=4&level=easy&seed=${seed}`);
    await ready(page, "puzzle-play");
    for (const [index, given] of givens.entries()) {
      if (given !== 0) continue;
      await page.getByTestId("puzzle-cell").nth(index).click();
      await page.getByTestId(`puzzle-key-${solution[index]}`).click();
    }
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
    await expect(page.getByTestId("puzzle-paid")).not.toContainText("Recording");

    const ip = String(price("numberPlace", 4, "easy"));
    expect(ip).toBe("50");
    const me = await memberIdFor(member.email);
    await page.goto("/points");
    await expect(page.getByTestId("site-ip-board-all").locator(`[data-testid="ip-row"][data-member="${me}"]`)).toHaveAttribute("data-ip", ip);
    await page.goto(`/players/${me}`);
    await expect(page.getByTestId("player-ip")).toHaveAttribute("data-ip", ip);
    await expect(page.getByTestId("member-strip").getByTestId("strip-ip")).toHaveAttribute("data-ip", ip);
    // And the page that says what a puzzle pays names Number Place's range, from the same ladder.
    await page.goto("/points");
    await expect(page.locator('[data-testid="ip-puzzle-price"][data-variant="numberPlace"]')).toContainText("50 to 150");
  } finally {
    await context.close();
    await removeMember(member.email);
  }
});
