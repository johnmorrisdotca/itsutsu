import { expect, test } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generatePuzzle } from "../src/lib/puzzles/generate";
import { decodeJigsaw } from "../src/lib/puzzles/jigsaw/code";
import { checkSolution } from "../src/lib/puzzles/puzzleCheck";
import { decodeCells } from "../src/lib/puzzles/puzzleCode";
import { PUZZLE_DISPLAY } from "../src/lib/puzzles/puzzles.constants";
import { ready } from "./support";

/**
 * JIGSAW: Number Place with irregular regions. The regions the page draws are
 * the ones in the puzzle's code, it is filled cell then key from the answer
 * the spec makes from the same seed, and the route refuses a square whose
 * rows and columns are right but whose regions are not.
 */
const KIND = "jigsaw";
const SIZE = 5;
const LEVEL = "easy";
const SEED = 6;
const AT = `/games/${PUZZLE_SLUGS[KIND]}`;

test.describe("the jigsaw puzzle", () => {
  test("its front door names what it is our version of", async ({ page }) => {
    await page.goto(AT);
    await expect(page.getByTestId("game-front-door").getByRole("heading", { level: 1 })).toContainText(PUZZLE_DISPLAY[KIND].label);
    await expect(page.getByTestId("inspired-by")).toContainText("Jigsaw Sudoku");
    await expect(page.getByTestId("game-family")).toContainText("Numbers");
  });

  test("the regions drawn are the puzzle's own, and the right numbers finish it", async ({ page }) => {
    const puzzle = generatePuzzle(KIND, SIZE, LEVEL, SEED);
    const asked = decodeJigsaw(puzzle.givens, SIZE)!;
    const solution = decodeCells(puzzle.solution, SIZE)!;

    await page.goto(`${AT}/play?size=${SIZE}&level=${LEVEL}&seed=${SEED}`);
    await ready(page, "puzzle-play");
    const cells = page.getByTestId("puzzle-cell");
    await expect(cells).toHaveCount(SIZE * SIZE);
    for (const [index, region] of asked.regions.entries()) {
      await expect(cells.nth(index)).toHaveAttribute("data-region", String(region));
    }

    for (const [index, given] of asked.cells.entries()) {
      if (given !== 0) continue;
      await cells.nth(index).click();
      await page.getByTestId(`puzzle-key-${solution[index]}`).click();
    }
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
  });

  test("the route refuses a square that breaks a region", async ({ request }) => {
    const puzzle = generatePuzzle(KIND, SIZE, LEVEL, SEED);
    // Every row a step along from the one above: right in every row and column, and not in these regions.
    const latin = Array.from({ length: SIZE * SIZE }, (_, index) => ((Math.floor(index / SIZE) + (index % SIZE)) % SIZE) + 1);
    const blank = ".".repeat(SIZE * SIZE) + puzzle.givens.slice(SIZE * SIZE);
    const answer = latin.join("");
    expect(checkSolution(KIND, SIZE, blank, answer).ok, "the spec's square should break a region").toBe(false);
    const refused = await request.post("/api/puzzles/solved", { data: { kind: KIND, size: SIZE, level: LEVEL, givens: blank, answer } });
    expect(refused.status()).toBe(422);
  });
});
