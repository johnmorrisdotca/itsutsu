import { expect, test } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { markGuess } from "../src/lib/puzzles/gomoji/code";
import { guessesFor } from "../src/lib/puzzles/gomoji/layout";
import { popCategoryOf } from "../src/lib/puzzles/gomoji/popWords";
import { generatePuzzle } from "../src/lib/puzzles/generate";
import { PUZZLE_DISPLAY } from "../src/lib/puzzles/puzzles.constants";
import { freshPuzzleSeed, ready } from "./support";

/**
 * Pop Gomoji: Gomoji over a hand-kept pop-culture list, three to seven
 * letters, each hidden word shown with its category as the clue. What this
 * drives is what is its own: the clue, a guess from the dictionary beside the
 * list, the seven-letter board and its lazily fetched guesses, and the set-up
 * screen's two shelves of sizes.
 */
const KIND = "gomojiPop";
const AT = `/games/${PUZZLE_SLUGS[KIND]}`;
const NAME = PUZZLE_DISPLAY[KIND].label;

test.describe("Pop Gomoji", () => {
  test("its front door names it and what it is our version of, and never a trademark as its name", async ({ page }) => {
    await page.goto(AT);
    await expect(page.getByTestId("game-front-door").getByRole("heading", { level: 1 })).toContainText(NAME);
    expect(NAME).not.toMatch(/wordle/i);
    await expect(page.getByTestId("inspired-by")).toContainText("Wordle");
  });

  test("the set-up offers three to six letters, turns to four to seven, and seven opens a seven-letter board", async ({ page }) => {
    await page.goto(`${AT}/new`);
    await ready(page, "puzzle-set-up");
    const sizes = page.getByTestId("set-up-size");
    await expect(sizes).toHaveCount(4);
    await expect(page.locator('[data-testid="set-up-size"][data-size="3"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="set-up-size"][data-size="7"]')).toHaveCount(0);

    await page.getByTestId("puzzle-more-sizes").click();
    const seven = page.locator('[data-testid="set-up-size"][data-size="7"]');
    await expect(seven).toHaveCount(1);
    await expect(page.locator('[data-testid="set-up-size"][data-size="3"]')).toHaveCount(0);
    await seven.click();
    await expect(seven).toHaveAttribute("data-chosen", "true");

    // And back: the first shelf again, its three-letter tile with it.
    await page.getByTestId("puzzle-more-sizes").click();
    await expect(page.locator('[data-testid="set-up-size"][data-size="3"]')).toHaveCount(1);
    await page.getByTestId("puzzle-more-sizes").click();
    await page.locator('[data-testid="set-up-size"][data-size="7"]').click();

    await page.getByTestId("puzzle-solve").click();
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("puzzle-grid")).toHaveAttribute("data-size", "7");
  });

  test.describe("on a phone", () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

    for (const size of [3, 5, 7] as const) {
      test(`a ${size}-letter word shows its category, takes a dictionary word, fits the phone, and is found`, async ({ page }) => {
        const level = "medium";
        const seed = freshPuzzleSeed();
        const puzzle = generatePuzzle(KIND, size, level, seed);
        await page.goto(`${AT}/play?size=${size}&level=${level}&seed=${seed}`);
        await ready(page, "puzzle-play");
        await expect(page.getByTestId("word-tile")).toHaveCount(size * guessesFor("gomoji", size, level, 0));

        // The clue: the hidden word's category, above the board from the start.
        await expect(page.getByTestId("pop-clue")).toContainText(popCategoryOf(puzzle.solution)!);

        // The board stays inside the phone at every length: nothing scrolls sideways.
        const box = (await page.getByTestId("puzzle-grid").boundingBox())!;
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(390);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);

        // An everyday English word is a guess too, not only the list's: at three and seven from Pop's own dictionary file.
        const guess = { 3: "cat", 5: "table", 7: "example" }[size];
        if (guess !== puzzle.solution) {
          for (const letter of guess) await page.getByTestId(`word-key-${letter}`).click();
          await page.getByTestId("word-key-enter").click();
          const row = page.locator('[data-testid="word-tile"][data-row="0"]');
          for (const [at, mark] of markGuess(guess, puzzle.solution).entries()) await expect(row.nth(at)).toHaveAttribute("data-mark", mark);
        }

        await page.keyboard.type(puzzle.solution);
        await page.keyboard.press("Enter");
        await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
        // No foreign dictionary's credit line: Pop's guesses are SCOWL's, which asks for none.
        await expect(page.getByTestId("word-credit")).toHaveCount(0);
      });
    }
  });
});
