import { expect, test } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generatePuzzle } from "../src/lib/puzzles/generate";
import { decodeCells } from "../src/lib/puzzles/puzzleCode";
import { isWord } from "../src/lib/puzzles/gomoji/code";
import { PLAYER_STATE, freshPuzzleSeed, ready } from "./support";

/**
 * A FINISHED PUZZLE OPENS AS IT ENDED. John, 2026-09-25: "Drilldown into
 * solved puzzles doesn't work. Sudoku I couldn't see a game." A row on the
 * Puzzles tab led to the list it was in; now it opens the puzzle itself, its
 * grid as it was finished and how it went — and only for its solver.
 */
test("a solve on the Puzzles tab opens its own finished grid, its time and its points, and nobody else's eyes", async ({ page, browser }) => {
  const seed = freshPuzzleSeed();
  const puzzle = generatePuzzle("numberPlace", 4, "easy", seed);
  const handed = await page.request.post("/api/puzzles/solved", {
    data: { kind: "numberPlace", size: 4, level: "easy", seed, givens: puzzle.givens, answer: puzzle.solution, elapsedMs: 83_000 },
  });
  expect(handed.ok()).toBe(true);

  await page.goto("/play?view=puzzles");
  await ready(page, "tabs");
  await page.getByTestId("puzzle-solved").first().getByTestId("puzzle-solved-open").click();
  await expect(page).toHaveURL(new RegExp(`/games/${PUZZLE_SLUGS.numberPlace}/me/[^/]+$`));
  const shown = page.getByTestId("solve-page");
  await expect(shown).toHaveAttribute("data-kept", "true");
  await expect(page.getByTestId("solve-outcome")).toHaveText("Solved");
  await expect(page.getByTestId("solve-time")).toHaveText("1:23");
  await expect(page.getByTestId("solve-points")).not.toHaveText("0");

  // Every cell holds the answer, printed or written, and none can be changed.
  const solution = decodeCells(puzzle.solution, 4)!;
  const cells = page.getByTestId("puzzle-cell");
  await expect(cells).toHaveCount(16);
  for (const [index, value] of solution.entries()) await expect(cells.nth(index)).toHaveAttribute("data-value", String(value));
  await expect(page.getByTestId("puzzle-grid")).toHaveAttribute("data-done", "true");

  // Somebody else, signed in as another member, is told there is no such puzzle.
  const address = page.url();
  const other = await browser.newContext({ storageState: PLAYER_STATE });
  const stranger = await other.newPage();
  const answered = await stranger.goto(address);
  expect(answered?.status()).toBe(404);
  await other.close();
});

test("a word not found opens from Your words with its guesses on the grid", async ({ page }) => {
  const seed = freshPuzzleSeed();
  const puzzle = generatePuzzle("gomoji", 4, "hard", seed);
  const wrong = ["tree", "cake", "moon", "fish", "bird", "lamp", "rope"].filter((word) => word !== puzzle.solution && isWord(word, 4)).slice(0, 5);
  const ended = await page.request.post("/api/puzzles/solved", {
    data: { kind: "gomoji", size: 4, level: "hard", seed, givens: puzzle.givens, answer: wrong.join(""), elapsedMs: 30_000, outOfGuesses: true },
  });
  expect(ended.ok()).toBe(true);

  await page.goto(`/games/${PUZZLE_SLUGS.gomoji}/me`);
  await page.getByTestId("word-history-row").first().getByTestId("word-history-word").click();
  await expect(page.getByTestId("solve-outcome")).toHaveText("Not found");
  await expect(page.getByTestId("solve-word")).toHaveText(puzzle.solution.toUpperCase());
  await expect(page.locator('[data-testid="word-tile"][data-row="0"]').first()).toHaveAttribute("aria-label", new RegExp(`^${wrong[0]![0]!.toUpperCase()}, `));
  await expect(page.locator('[data-testid="word-tile"][data-row="4"]').first()).not.toHaveAttribute("data-mark", "empty");
  // Replayable here too, with its keyboard.
  await expect(page.getByTestId("word-replay")).toHaveAttribute("data-last", "5");
  await expect(page.getByTestId("word-keyboard")).toBeVisible();
});
