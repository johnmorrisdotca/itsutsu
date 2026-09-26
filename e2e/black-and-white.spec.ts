import { expect, test } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { BLACK, decodeBlackAndWhite, EMPTY, encodeBlackAndWhite, WHITE } from "../src/lib/puzzles/blackAndWhite/code";
import { generatePuzzle } from "../src/lib/puzzles/generate";
import { PUZZLE_DISPLAY } from "../src/lib/puzzles/puzzles.constants";
import { freshPuzzleSeed, ready } from "./support";

/**
 * Black and White: a grid of black and white stones, half of each in every
 * line and never three alike. Solved by tapping, once for black and twice for
 * white, from the answer the spec makes from the same seed; a printed stone
 * does not move when pressed.
 */
const KIND = "blackAndWhite";
const SIZE = 6;
const LEVEL = "easy";
const SEED = 6;
const NAME = PUZZLE_DISPLAY[KIND].label;
const AT = `/games/${PUZZLE_SLUGS[KIND]}`;

test.describe("the black and white puzzle", () => {
  test("its front door names what it is our version of", async ({ page }) => {
    await page.goto(AT);
    await expect(page.getByTestId("game-front-door").getByRole("heading", { level: 1 })).toContainText(NAME);
    await expect(page.getByTestId("inspired-by")).toContainText("Takuzu");
    await expect(page.getByTestId("game-family")).toContainText("Numbers");
  });

  test("printed stones stay put, and tapping the answer in finishes it", async ({ page }) => {
    const puzzle = generatePuzzle(KIND, SIZE, LEVEL, SEED);
    const givens = decodeBlackAndWhite(puzzle.givens, SIZE)!;
    const solution = decodeBlackAndWhite(puzzle.solution, SIZE)!;

    await page.goto(`${AT}/play?size=${SIZE}&level=${LEVEL}&seed=${SEED}`);
    await ready(page, "puzzle-play");
    const cells = page.getByTestId("puzzle-cell");
    await expect(cells).toHaveCount(SIZE * SIZE);
    const printedAt = givens.findIndex((given) => given !== EMPTY);
    await expect(cells.nth(printedAt)).toHaveAttribute("data-given", "true");
    await expect(cells.nth(printedAt)).toBeDisabled();

    for (const [index, given] of givens.entries()) {
      if (given !== EMPTY) continue;
      await cells.nth(index).click();
      await expect(cells.nth(index)).toHaveAttribute("data-stone", "black");
      if (solution[index] === WHITE) {
        await cells.nth(index).click();
        await expect(cells.nth(index)).toHaveAttribute("data-stone", "white");
      }
    }
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
    await expect(page.getByTestId("puzzle-paid")).toContainText(/XP|Already paid/);
  });

  test("paused and left, it opens where it was left, with the stone put down still there", async ({ page }) => {
    const seed = freshPuzzleSeed();
    const puzzle = generatePuzzle(KIND, SIZE, LEVEL, seed);
    const givens = decodeBlackAndWhite(puzzle.givens, SIZE)!;
    const first = givens.findIndex((given) => given === EMPTY);

    await page.goto(`${AT}/play?size=${SIZE}&level=${LEVEL}&seed=${seed}`);
    await ready(page, "puzzle-play");
    // Two taps: a white stone, so what comes back is the colour and not merely "something".
    await page.getByTestId("puzzle-cell").nth(first).click();
    await page.getByTestId("puzzle-cell").nth(first).click();
    await expect(page.getByTestId("puzzle-cell").nth(first)).toHaveAttribute("data-stone", "white");
    await page.getByTestId("puzzle-pause").click();
    await expect(page.getByTestId("puzzle-paused")).toBeVisible();
    await page.getByRole("navigation").getByRole("link", { name: /^My games/ }).first().click();
    await expect(page).toHaveURL(/\/play$/);
    // The puzzles have a tab of their own on My games, with its count on it.
    await ready(page, "tabs");
    await page.locator('[data-testid="tab"][data-tab="going"]').click();

    const row = page.locator(`[data-testid="puzzle-going"][data-seed="${seed}"]`);
    await expect(row).toBeVisible();
    await row.getByTestId("puzzle-going-continue").click();
    await ready(page, "puzzle-play");
    // Continue is the resume: the puzzle opens running, with no cover to press through.
    await expect(page.getByTestId("puzzle-pausable")).toHaveAttribute("data-paused", "false");
    await expect(page.getByTestId("puzzle-cell").nth(first)).toHaveAttribute("data-stone", "white");
    // The printed stones are where they were printed, whatever was kept.
    const printedAt = givens.findIndex((given) => given !== EMPTY);
    await expect(page.getByTestId("puzzle-cell").nth(printedAt)).toHaveAttribute("data-given", "true");
  });

  test("the route refuses a grid with every stone turned over", async ({ request }) => {
    const puzzle = generatePuzzle(KIND, SIZE, LEVEL, SEED);
    const solution = decodeBlackAndWhite(puzzle.solution, SIZE)!;
    // Still half each and never three alike, so only the printed stones say no.
    const flipped = solution.map((stone) => (stone === BLACK ? WHITE : BLACK));
    const refused = await request.post("/api/puzzles/solved", {
      data: { kind: KIND, size: SIZE, level: LEVEL, givens: puzzle.givens, answer: encodeBlackAndWhite(flipped) },
    });
    expect(refused.status()).toBe(422);
  });
});
