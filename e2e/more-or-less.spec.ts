import { expect, test } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generatePuzzle } from "../src/lib/puzzles/generate";
import { decodeMoreOrLess } from "../src/lib/puzzles/moreOrLess/code";
import { decodeCells } from "../src/lib/puzzles/puzzleCode";
import { PUZZLE_DISPLAY } from "../src/lib/puzzles/puzzles.constants";
import { ready } from "./support";

/**
 * The marks puzzle: a Latin square with more-than marks drawn between its
 * cells. Filled the way Number Place is, cell then key, from the answer the
 * spec makes from the same seed; the marks are on the page as the code says.
 */
const KIND = "moreOrLess";
const SIZE = 4;
const LEVEL = "easy";
const SEED = 6;
const NAME = PUZZLE_DISPLAY[KIND].label;
const AT = `/games/${PUZZLE_SLUGS[KIND]}`;

test.describe("the marks puzzle", () => {
  test("its front door names what it is our version of", async ({ page }) => {
    await page.goto(AT);
    await expect(page.getByTestId("game-front-door").getByRole("heading", { level: 1 })).toContainText(NAME);
    await expect(page.getByTestId("inspired-by")).toContainText("Futoshiki");
    await expect(page.getByTestId("game-family")).toContainText("Numbers");
  });

  test("the marks are drawn between the cells, and the right numbers finish it", async ({ page }) => {
    const puzzle = generatePuzzle(KIND, SIZE, LEVEL, SEED);
    const asked = decodeMoreOrLess(puzzle.givens, SIZE)!;
    const solution = decodeCells(puzzle.solution, SIZE)!;

    await page.goto(`${AT}/play?size=${SIZE}&level=${LEVEL}&seed=${SEED}`);
    await ready(page, "puzzle-play");
    const cells = page.getByTestId("puzzle-cell");
    await expect(cells).toHaveCount(SIZE * SIZE);
    await expect(page.getByTestId("puzzle-mark")).toHaveCount(asked.marks.length);

    for (const [index, given] of asked.cells.entries()) {
      if (given !== 0) continue;
      await cells.nth(index).click();
      await page.getByTestId(`puzzle-key-${solution[index]}`).click();
    }
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
    await expect(page.getByTestId("puzzle-paid")).toContainText(/XP|Already paid/);
  });

  test("the route refuses a square that breaks a mark", async ({ request }) => {
    const puzzle = generatePuzzle(KIND, SIZE, LEVEL, SEED);
    const asked = decodeMoreOrLess(puzzle.givens, SIZE)!;
    const solution = decodeCells(puzzle.solution, SIZE)!;
    // Reverse every number: still a Latin square, every mark now false, so the check must say no.
    const reversed = solution.map((value) => SIZE + 1 - value);
    const answer = reversed.map((value) => String(value)).join("");
    const refused = await request.post("/api/puzzles/solved", {
      data: { kind: KIND, size: SIZE, level: LEVEL, givens: puzzle.givens, answer },
    });
    expect(asked.marks.length + asked.cells.filter((cell) => cell !== 0).length).toBeGreaterThan(0);
    expect(refused.status()).toBe(422);
  });
});
