import { expect, test } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generatePuzzle } from "../src/lib/puzzles/generate";
import { decodeCells } from "../src/lib/puzzles/puzzleCode";
import { PUZZLE_DISPLAY } from "../src/lib/puzzles/puzzles.constants";
import { decodeTowers, TOWER_SIDES } from "../src/lib/puzzles/towers/code";
import { ready } from "./support";

/**
 * Towers: a Latin square with clues around its edge saying how many towers
 * show from there. Filled the way Number Place is, cell then key, from the
 * answer the spec makes from the same seed; the clues stand on the wood
 * around the square exactly as the code says.
 */
const KIND = "towers";
const SIZE = 4;
const LEVEL = "easy";
const SEED = 6;
const NAME = PUZZLE_DISPLAY[KIND].label;
const AT = `/games/${PUZZLE_SLUGS[KIND]}`;

test.describe("the towers puzzle", () => {
  test("its front door names what it is our version of", async ({ page }) => {
    await page.goto(AT);
    await expect(page.getByTestId("game-front-door").getByRole("heading", { level: 1 })).toContainText(NAME);
    await expect(page.getByTestId("inspired-by")).toContainText("Skyscrapers");
    await expect(page.getByTestId("game-family")).toContainText("Numbers");
  });

  test("the clues stand around the square, and the right heights finish it", async ({ page }) => {
    const puzzle = generatePuzzle(KIND, SIZE, LEVEL, SEED);
    const asked = decodeTowers(puzzle.givens, SIZE)!;
    const solution = decodeCells(puzzle.solution, SIZE)!;

    await page.goto(`${AT}/play?size=${SIZE}&level=${LEVEL}&seed=${SEED}`);
    await ready(page, "puzzle-play");
    const cells = page.getByTestId("puzzle-cell");
    await expect(cells).toHaveCount(SIZE * SIZE);
    const clues = page.getByTestId("puzzle-tower-clue");
    const printed = TOWER_SIDES.flatMap((side) => asked.clues[side].flatMap((clue, at) => (clue === 0 ? [] : [{ side, at, clue }])));
    await expect(clues).toHaveCount(printed.length);
    for (const { side, at, clue } of printed) {
      await expect(page.locator(`[data-testid="puzzle-tower-clue"][data-side="${side}"][data-at="${at}"]`)).toContainText(String(clue));
    }

    for (const [index, given] of asked.cells.entries()) {
      if (given !== 0) continue;
      await cells.nth(index).click();
      await page.getByTestId(`puzzle-key-${solution[index]}`).click();
    }
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
    await expect(page.getByTestId("puzzle-paid")).toContainText(/XP|Already paid/);
  });

  test("the route refuses a square whose towers do not show what the clues say", async ({ request }) => {
    const puzzle = generatePuzzle(KIND, SIZE, LEVEL, SEED);
    const asked = decodeTowers(puzzle.givens, SIZE)!;
    const solution = decodeCells(puzzle.solution, SIZE)!;
    // Every height turned upside down: still a Latin square, and every clue now sees the other end's count.
    const reversed = solution.map((value) => SIZE + 1 - value);
    expect(asked.cells.every((given) => given === 0), "a given would make the reversal fail for a different reason").toBe(true);
    const refused = await request.post("/api/puzzles/solved", {
      data: { kind: KIND, size: SIZE, level: LEVEL, givens: puzzle.givens, answer: reversed.join("") },
    });
    expect(refused.status()).toBe(422);
  });
});
