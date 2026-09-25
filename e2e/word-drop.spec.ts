import { expect, test } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generatePuzzle } from "../src/lib/puzzles/generate";
import { PUZZLE_DISPLAY } from "../src/lib/puzzles/puzzles.constants";
import { isWord, markGuess } from "../src/lib/puzzles/wordDrop/code";
import { freshPuzzleSeed, ready } from "./support";

/**
 * WordDrop: a hidden word found in guesses, each coloured letter by letter.
 * Typed on the keyboard under the grid, as a phone is used, and on the desk's
 * keyboard; the colours on the page are the ones the rules give; a word the
 * list does not know is refused and costs nothing; and running out of guesses
 * ends the puzzle and shows the word.
 */
const KIND = "wordDrop";
const LEVEL = "easy";
const NAME = PUZZLE_DISPLAY[KIND].label;
const AT = `/games/${PUZZLE_SLUGS[KIND]}`;

/** Two real words that are not the answer and share nothing with each other, for guesses that must miss. */
function misses(answer: string, count: number): string[] {
  return ["slate", "irony", "chump", "gawky", "fjord", "blitz", "crane", "mound"].filter((word) => word !== answer && isWord(word, 5)).slice(0, count);
}

test.describe("the word puzzle", () => {
  test("its front door names it, its family and what it is our version of", async ({ page }) => {
    await page.goto(AT);
    await expect(page.getByTestId("game-front-door").getByRole("heading", { level: 1 })).toContainText(NAME);
    await expect(page.getByTestId("inspired-by")).toContainText("Wordle");
    await expect(page.getByTestId("game-family")).toContainText("Other");
  });

  test("a guess is coloured as the rules say, and the word found finishes it", async ({ page }) => {
    const seed = freshPuzzleSeed();
    const puzzle = generatePuzzle(KIND, 5, LEVEL, seed);
    await page.goto(`${AT}/play?size=5&level=${LEVEL}&seed=${seed}`);
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("word-tile")).toHaveCount(30);

    // A word the list does not know is refused, and no row is spent on it.
    await page.keyboard.type("qqqqq");
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("word-said")).toContainText("not in the word list");
    for (let i = 0; i < 5; i += 1) await page.getByTestId("word-key-back").click();

    // A wrong word, typed on the keys under the grid, and its colours read off the tiles.
    const [miss] = misses(puzzle.solution, 1);
    for (const letter of miss!) await page.getByTestId(`word-key-${letter}`).click();
    await page.getByTestId("word-key-enter").click();
    const expected = markGuess(miss!, puzzle.solution);
    const row = page.locator('[data-testid="word-tile"][data-row="0"]');
    for (const [at, mark] of expected.entries()) await expect(row.nth(at)).toHaveAttribute("data-mark", mark);

    // The word, on the desk's keyboard.
    await page.keyboard.type(puzzle.solution);
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
    await expect(page.getByTestId("puzzle-paid")).toContainText(/XP|Already paid/);
  });

  test("running out of guesses ends it and shows the word", async ({ page }) => {
    const seed = freshPuzzleSeed();
    const puzzle = generatePuzzle(KIND, 4, LEVEL, seed);
    await page.goto(`${AT}/play?size=4&level=${LEVEL}&seed=${seed}`);
    await ready(page, "puzzle-play");
    const wrong = ["tree", "cake", "moon", "fish", "bird", "lamp", "rope"].filter((word) => word !== puzzle.solution && isWord(word, 4)).slice(0, 5);
    expect(wrong).toHaveLength(5);
    for (const word of wrong) {
      await page.keyboard.type(word);
      await page.keyboard.press("Enter");
    }
    await expect(page.getByTestId("word-out")).toBeVisible();
    await expect(page.getByTestId("word-was")).toHaveText(puzzle.solution);
  });

  test("the route refuses guesses that never found the word", async ({ request }) => {
    const puzzle = generatePuzzle(KIND, 5, LEVEL, 7);
    const refused = await request.post("/api/puzzles/solved", {
      data: { kind: KIND, size: 5, level: LEVEL, givens: puzzle.givens, answer: misses(puzzle.solution, 2).join("") },
    });
    expect(refused.status()).toBe(422);
  });
});

test("today's word is one address for the day, reached from WordDrop's own page", async ({ page }) => {
  const { dailySeed } = await import("../src/lib/puzzles/daily");
  await page.goto("/games/word-drop");
  await page.getByTestId("game-daily").click();
  // The same seed for everybody today, on an ordinary address that can be shared and kept.
  await expect(page).toHaveURL(new RegExp(`/games/word-drop/play\\?.*seed=${dailySeed(new Date())}`));
});
