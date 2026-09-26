import { expect, test, type Page } from "@playwright/test";

import { familyOf } from "../src/lib/gomoku/families";
import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generatePuzzle } from "../src/lib/puzzles/generate";
import { decodeStones } from "../src/lib/puzzles/hiddenStones/code";
import { PUZZLE_DISPLAY, PUZZLE_KIND_LIST } from "../src/lib/puzzles/puzzles.constants";
import type { PuzzleLevel } from "../src/lib/puzzles/puzzles.types";
import { freshPuzzleSeed, ready } from "./support";

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

/** Opens a puzzle and taps every row's stone where the answer has it, as a person would, until it is solved. */
async function solveThrough(page: Page, size: number, level: PuzzleLevel, seed: number) {
  const puzzle = generatePuzzle(KIND, size, level, seed);
  const stones = decodeStones(puzzle.solution, size)!;
  await page.goto(`${AT}/play?size=${size}&level=${level}&seed=${seed}`);
  await ready(page, "puzzle-play");
  await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-seed", String(seed));
  const cells = page.getByTestId("puzzle-cell");
  await expect(cells).toHaveCount(size * size);
  for (const [row, col] of stones.entries()) await cells.nth(row * size + col).click();
  await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
  await expect(page.getByTestId("puzzle-asked")).toContainText(`${size}×${size}`);
}

test.describe("the stone puzzle", () => {
  test("its front door names what it is our version of, and its family", async ({ page }) => {
    await page.goto(AT);
    await expect(page.getByTestId("game-front-door").getByRole("heading", { level: 1 })).toContainText(NAME);
    await expect(page.getByTestId("inspired-by")).toContainText("Star Battle");
    await expect(page.getByTestId("game-family")).toContainText("Numbers");
    // Every other puzzle in its family (Numbers, not every puzzle: Gomoji's is Other) is a sibling here, with its picture.
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

  /*
   * LINES, beside Hint where hints were chosen. John, 2026-09-26: "When toggled
   * on, we show lasers (or lines) from each stone in all 4 directions… the
   * button could be called LINES and only appears when Hints are on." Driven
   * by clicking, on and off, and counted as one hint for the puzzle however
   * often it is pressed.
   */
  test("with hints chosen, Lines draws each stone's row and column, counts once as a hint, and comes off", async ({ page }) => {
    const seed = freshPuzzleSeed();
    const puzzle = generatePuzzle(KIND, 7, LEVEL, seed);
    const stones = decodeStones(puzzle.solution, 7)!;
    await page.goto(`${AT}/play?size=7&level=${LEVEL}&seed=${seed}&hints=1`);
    await ready(page, "puzzle-play");
    const lines = page.getByTestId("puzzle-lines");
    const hint = page.getByTestId("puzzle-hint");
    await expect(lines).toHaveAttribute("aria-pressed", "false");
    await expect(hint).toContainText("0 used");

    // On before the first stone: nothing to draw yet, and nothing counted until the clock runs.
    await lines.click();
    await expect(lines).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("stone-lines")).toHaveAttribute("data-stones", "0");
    await expect(hint).toContainText("0 used");

    // A stone: its four lines, and the help counted once.
    const first = page.getByTestId("puzzle-cell").nth(stones[0]!);
    await first.click();
    await expect(first).toHaveAttribute("data-mark", "stone");
    await expect(page.getByTestId("stone-lines")).toHaveAttribute("data-stones", "1");
    await expect(page.getByTestId("stone-line").locator("line")).toHaveCount(4);
    await expect(hint).toContainText("1 used");
    // A second stone draws its own four.
    await page.getByTestId("puzzle-cell").nth(7 + stones[1]!).click();
    await expect(page.getByTestId("stone-line")).toHaveCount(2);

    // Off: the lines go, the stones stay.
    await lines.click();
    await expect(lines).toHaveAttribute("aria-pressed", "false");
    await expect(first).toHaveAttribute("data-mark", "stone");
    await expect(page.getByTestId("stone-lines")).toHaveCount(0);
    // On again: back, and not counted a second time for the same puzzle.
    await lines.click();
    await expect(page.getByTestId("stone-line")).toHaveCount(2);
    await expect(hint).toContainText("1 used");

    // Remembered: the next puzzle with hints opens with them on, and they come off from there too.
    const next = freshPuzzleSeed();
    await page.goto(`${AT}/play?size=7&level=${LEVEL}&seed=${next}&hints=1`);
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("puzzle-lines")).toHaveAttribute("aria-pressed", "true");
    await page.getByTestId("puzzle-lines").click();
    await expect(page.getByTestId("puzzle-lines")).toHaveAttribute("aria-pressed", "false");
  });

  test("without hints chosen there is no Lines, and no lines are drawn", async ({ page }) => {
    const seed = freshPuzzleSeed();
    await page.goto(`${AT}/play?size=7&level=${LEVEL}&seed=${seed}`);
    await ready(page, "puzzle-play");
    await page.getByTestId("puzzle-cell").first().click();
    await expect(page.getByTestId("puzzle-cell").first()).toHaveAttribute("data-mark", "stone");
    // Asked once Hint is drawn (switched off, where Lines would sit beside it), so the absence is about a rendered row.
    await expect(page.getByTestId("puzzle-hint")).toHaveAttribute("data-allowed", "false");
    await expect(page.getByTestId("puzzle-lines")).toHaveCount(0);
    await expect(page.getByTestId("stone-lines")).toHaveCount(0);
  });

  /*
   * THE BEGINNER'S 4×4 AND THE 12×12. John, 2026-09-26: "is it possible to add
   * a 12x12 game? and a beginner 4x4 game?" Each played to the end through its
   * cells; a 4×4 is easy only, and its set-up says so by switching Hard off.
   */
  for (const [size, level] of [[4, "easy"], [12, "easy"], [12, "hard"]] as [number, PuzzleLevel][]) {
    test(`a ${size}×${size} ${level} is played to the end`, async ({ page }) => {
      await solveThrough(page, size, level, freshPuzzleSeed());
    });
  }

  test("the set-up offers 4×4 at easy only, and 12×12 at both levels", async ({ page }) => {
    await page.goto(`${AT}/new`);
    await ready(page, "puzzle-set-up");
    const hard = page.getByTestId("puzzle-level-hard");
    await hard.click();
    await expect(hard).toHaveAttribute("aria-checked", "true");
    await page.locator('[data-testid="set-up-size"][data-size="4"]').click();
    await expect(page.getByTestId("set-up-puzzle-preview")).toHaveAttribute("data-size", "4");
    await expect(hard).toBeDisabled();
    await expect(page.getByTestId("puzzle-level-easy")).toHaveAttribute("aria-checked", "true");
    await expect(page.getByTestId("puzzle-solve")).toHaveAttribute("href", /size=4&level=easy/);
    // The choice of hard comes back with a size that has it.
    await page.locator('[data-testid="set-up-size"][data-size="12"]').click();
    await expect(hard).toBeEnabled();
    await expect(hard).toHaveAttribute("aria-checked", "true");
    await expect(page.getByTestId("puzzle-solve")).toHaveAttribute("href", /size=12&level=hard/);
    // The preview draws the site's stones, every other row.
    await expect(page.getByTestId("puzzle-preview-stone")).toHaveCount(6);
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
