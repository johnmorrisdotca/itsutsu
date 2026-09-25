import { expect, test } from "@playwright/test";

import { familyOf } from "../src/lib/gomoku/families";
import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generatePuzzle } from "../src/lib/puzzles/generate";
import { decodeStones } from "../src/lib/puzzles/hiddenStones/code";
import { PUZZLE_DISPLAY, PUZZLE_KIND_LIST } from "../src/lib/puzzles/puzzles.constants";
import { ready } from "./support";

/**
 * The stone puzzle: a tap places a stone, a second a cross, a third clears;
 * a stone in every row that matches the answer stops the clock and pays.
 * The spec makes the same puzzle from the same seed the page does and taps
 * where the answer says, the way a person would — through the cells.
 */
const KIND = "hiddenStones";
const SIZE = 5;
const LEVEL = "easy";
const SEED = 3;
const NAME = PUZZLE_DISPLAY[KIND].label;
const AT = `/games/${PUZZLE_SLUGS[KIND]}`;

test.describe("the stone puzzle", () => {
  test("its front door names what it is our version of, and its family", async ({ page }) => {
    await page.goto(AT);
    await expect(page.getByTestId("game-front-door").getByRole("heading", { level: 1 })).toContainText(NAME);
    await expect(page.getByTestId("inspired-by")).toContainText("Star Battle");
    await expect(page.getByTestId("game-family")).toContainText("Numbers");
    // Every other puzzle in its family (Numbers, not every puzzle: WordDrop's is Other) is a sibling here, with its picture.
    const numbers = PUZZLE_KIND_LIST.filter((kind) => familyOf(kind)?.key === "numbers");
    await expect(page.getByTestId("game-family").getByTestId("game-thumb")).toHaveCount(numbers.length - 1);
  });

  test("a tap is a stone, another a cross, another nothing, and the right stones finish it", async ({ page }) => {
    const puzzle = generatePuzzle(KIND, SIZE, LEVEL, SEED);
    const stones = decodeStones(puzzle.solution, SIZE)!;

    await page.goto(`${AT}/play?size=${SIZE}&level=${LEVEL}&seed=${SEED}`);
    await ready(page, "puzzle-play");
    const cells = page.getByTestId("puzzle-cell");
    await expect(cells).toHaveCount(SIZE * SIZE);
    await expect(page.getByTestId("puzzle-check")).toBeDisabled();

    // A cell that is not the first row's stone: stone, cross, clear.
    const wrongCol = (stones[0] + 2) % SIZE;
    const wrongCell = cells.nth(wrongCol);
    await wrongCell.click();
    await expect(wrongCell).toHaveAttribute("data-mark", "stone");
    await page.getByTestId("puzzle-check").click();
    await expect(page.getByTestId("puzzle-checked")).toContainText("1 stone is wrong");
    await wrongCell.click();
    await expect(wrongCell).toHaveAttribute("data-mark", "cross");
    await wrongCell.click();
    await expect(wrongCell).toHaveAttribute("data-mark", "");

    for (const [row, col] of stones.entries()) await cells.nth(row * SIZE + col).click();

    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
    await expect(page.getByTestId("puzzle-grid")).toHaveAttribute("data-done", "true");
    await expect(page.getByTestId("puzzle-paid")).toContainText(/XP|Already paid/);
  });

  test("the route refuses stones that touch", async ({ request }) => {
    const puzzle = generatePuzzle(KIND, SIZE, LEVEL, SEED);
    const touching = puzzle.solution[0].repeat(SIZE);
    const refused = await request.post("/api/puzzles/solved", {
      data: { kind: KIND, size: SIZE, level: LEVEL, givens: puzzle.givens, answer: touching },
    });
    expect(refused.status()).toBe(422);
  });
});
