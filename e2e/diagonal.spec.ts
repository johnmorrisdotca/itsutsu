import { expect, test } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generatePuzzle } from "../src/lib/puzzles/generate";
import { checkSolution } from "../src/lib/puzzles/puzzleCheck";
import { decodeCells } from "../src/lib/puzzles/puzzleCode";
import { PUZZLE_DISPLAY } from "../src/lib/puzzles/puzzles.constants";
import { ready } from "./support";

/**
 * DIAGONAL: Number Place where the two long diagonals count too. The page
 * shades exactly those cells, it is filled cell then key from the answer the
 * spec makes from the same seed, and the route refuses a grid that is a
 * sound plain Number Place but repeats a number on a diagonal.
 */
const KIND = "diagonal";
const SIZE = 6;
const LEVEL = "easy";
const SEED = 6;
const AT = `/games/${PUZZLE_SLUGS[KIND]}`;

test.describe("the diagonal puzzle", () => {
  test("its front door names what it is our version of", async ({ page }) => {
    await page.goto(AT);
    await expect(page.getByTestId("game-front-door").getByRole("heading", { level: 1 })).toContainText(PUZZLE_DISPLAY[KIND].label);
    await expect(page.getByTestId("inspired-by")).toContainText("Sudoku X");
    await expect(page.getByTestId("game-family")).toContainText("Numbers");
  });

  test("both diagonals are shaded, and the right numbers finish it", async ({ page }) => {
    const puzzle = generatePuzzle(KIND, SIZE, LEVEL, SEED);
    const givens = decodeCells(puzzle.givens, SIZE)!;
    const solution = decodeCells(puzzle.solution, SIZE)!;

    await page.goto(`${AT}/play?size=${SIZE}&level=${LEVEL}&seed=${SEED}`);
    await ready(page, "puzzle-play");
    const cells = page.getByTestId("puzzle-cell");
    await expect(cells).toHaveCount(SIZE * SIZE);
    // Two diagonals of six, crossing nowhere on an even side.
    await expect(page.locator('[data-testid="puzzle-cell"][data-diagonal="true"]')).toHaveCount(2 * SIZE);

    for (const [index, given] of givens.entries()) {
      if (given !== 0) continue;
      await cells.nth(index).click();
      await page.getByTestId(`puzzle-key-${solution[index]}`).click();
    }
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
  });

  test("the route refuses a plain grid whose diagonal repeats", async ({ request }) => {
    const puzzle = generatePuzzle(KIND, SIZE, LEVEL, SEED);
    const solution = decodeCells(puzzle.solution, SIZE)!;
    // The top two rows swapped: the same box band, so rows, columns and boxes still hold — the diagonals need not.
    const swapped = [...solution.slice(SIZE, 2 * SIZE), ...solution.slice(0, SIZE), ...solution.slice(2 * SIZE)];
    const blank = ".".repeat(SIZE * SIZE);
    const answer = swapped.join("");
    expect(checkSolution("numberPlace", SIZE, blank, answer).ok, "still a sound plain grid").toBe(true);
    expect(checkSolution(KIND, SIZE, blank, answer).ok, "the swap should break a diagonal for this seed").toBe(false);
    const refused = await request.post("/api/puzzles/solved", { data: { kind: KIND, size: SIZE, level: LEVEL, givens: blank, answer } });
    expect(refused.status()).toBe(422);
  });
});
