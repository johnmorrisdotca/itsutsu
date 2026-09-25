import { expect, test } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generatePuzzle } from "../src/lib/puzzles/generate";
import { decodeKiller } from "../src/lib/puzzles/killer/code";
import { checkSolution } from "../src/lib/puzzles/puzzleCheck";
import { decodeCells } from "../src/lib/puzzles/puzzleCode";
import { PUZZLE_DISPLAY } from "../src/lib/puzzles/puzzles.constants";
import { ready } from "./support";

/**
 * SUM CAGES: our Killer Sudoku. The cages the page draws are the ones in the
 * puzzle's code, each with its sum; it is filled cell then key from the answer
 * the spec makes from the same seed; and the route refuses a grid that is
 * right as Number Place but wrong in a cage.
 */
const KIND = "sumCages";
const SIZE = 6;
const LEVEL = "easy";
const SEED = 8;
const AT = `/games/${PUZZLE_SLUGS[KIND]}`;

test.describe("the sum cages puzzle", () => {
  test("its front door names what it is our version of", async ({ page }) => {
    await page.goto(AT);
    await expect(page.getByTestId("game-front-door").getByRole("heading", { level: 1 })).toContainText(PUZZLE_DISPLAY[KIND].label);
    await expect(page.getByTestId("inspired-by")).toContainText("Killer Sudoku");
    await expect(page.getByTestId("game-family")).toContainText("Numbers");
  });

  test("the cages drawn are the puzzle's own, and the right numbers finish it", async ({ page }) => {
    const puzzle = generatePuzzle(KIND, SIZE, LEVEL, SEED);
    const asked = decodeKiller(puzzle.givens, SIZE)!;
    const solution = decodeCells(puzzle.solution, SIZE)!;

    await page.goto(`${AT}/play?size=${SIZE}&level=${LEVEL}&seed=${SEED}`);
    await ready(page, "puzzle-play");
    const cells = page.getByTestId("puzzle-cell");
    await expect(cells).toHaveCount(SIZE * SIZE);
    await expect(page.getByTestId("puzzle-cage-sum")).toHaveCount(asked.cages.length);
    for (const [c, cage] of asked.cages.entries()) {
      for (const index of cage.cells) await expect(cells.nth(index)).toHaveAttribute("data-cage", String(c));
      await expect(cells.nth(Math.min(...cage.cells)).getByTestId("puzzle-cage-sum")).toHaveText(String(cage.sum));
    }

    for (const [index, given] of asked.cells.entries()) {
      if (given !== 0) continue;
      await cells.nth(index).click();
      await page.getByTestId(`puzzle-key-${solution[index]}`).click();
    }
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
  });

  test("the route refuses a grid that is right in every row, column and box and wrong in a cage", async ({ request }) => {
    const puzzle = generatePuzzle(KIND, SIZE, LEVEL, SEED);
    const grid = decodeCells(puzzle.solution, SIZE)!;
    // Two whole bands of rows swapped: every row, column and box still right, the cages not.
    const swapped = [...grid.slice(12, 24), ...grid.slice(0, 12), ...grid.slice(24)].join("");
    const blank = ".".repeat(SIZE * SIZE) + puzzle.givens.slice(SIZE * SIZE);
    expect(checkSolution(KIND, SIZE, blank, swapped).ok, "the spec's grid should break a cage").toBe(false);
    const refused = await request.post("/api/puzzles/solved", { data: { kind: KIND, size: SIZE, level: LEVEL, givens: blank, answer: swapped } });
    expect(refused.status()).toBe(422);
  });
});
