import { expect, test } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generatePuzzle } from "../src/lib/puzzles/generate";
import { isWord, markGuess } from "../src/lib/puzzles/gomoji/code";
import { guessesFor } from "../src/lib/puzzles/gomoji/layout";
import { PUZZLE_SIZE_NAMES } from "../src/lib/puzzles/puzzles.constants";
import { freshPuzzleSeed, ready } from "./support";

/**
 * GOMOJI 6: six-letter words, in English, French and German. John,
 * 2026-09-26: "Introduce Gomoji 6. 6 letter words. hopefully still
 * challenging and still winnable." The size is a tile on the set-up screen,
 * the board is the 8×8 one four letters use (`layout.ts`), and a word is found
 * and paid as four and five are.
 */
const SIZE = 6;

/** Real six-letter words, one of which is not the answer, for a guess that must be coloured. */
function miss(answer: string): string {
  return ["planet", "breath", "jockey", "sphinx"].find((word) => word !== answer && isWord(word, SIZE))!;
}

test.describe("Gomoji 6", () => {
  test("six letters is a size on the set-up screen, and opens a six-letter board", async ({ page }) => {
    await page.goto(`/games/${PUZZLE_SLUGS.gomoji}/new`);
    await ready(page, "puzzle-set-up");
    const six = page.locator(`[data-testid="set-up-size"][data-size="${SIZE}"]`);
    await expect(six).toHaveCount(1);
    await expect(six.getByTestId("board-size-mark")).toHaveCount(1);
    await expect(six.getByTestId("set-up-size-name")).toContainText(PUZZLE_SIZE_NAMES.gomoji[SIZE]!.label);
    await six.click();
    await expect(six).toHaveAttribute("data-chosen", "true");
    await expect(page.getByTestId("set-up-puzzle-preview")).toHaveAttribute("data-size", String(SIZE));

    await page.getByTestId("puzzle-solve").click();
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("puzzle-grid")).toHaveAttribute("data-size", String(SIZE));
  });

  test.describe("on a phone", () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

    test("a six-letter word fits the phone, is coloured as the rules say, and the word found finishes it", async ({ page }) => {
      const level = "medium";
      const seed = freshPuzzleSeed();
      const puzzle = generatePuzzle("gomoji", SIZE, level, seed);
      await page.goto(`/games/${PUZZLE_SLUGS.gomoji}/play?size=${SIZE}&level=${level}&seed=${seed}`);
      await ready(page, "puzzle-play");
      await expect(page.getByTestId("word-tile")).toHaveCount(SIZE * guessesFor("gomoji", SIZE, level, 0));

      // The board, six across on eight squares, stays inside the phone: nothing scrolls sideways.
      const box = (await page.getByTestId("puzzle-grid").boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(390);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);

      const guess = miss(puzzle.solution);
      for (const letter of guess) await page.getByTestId(`word-key-${letter}`).click();
      await page.getByTestId("word-key-enter").click();
      const row = page.locator('[data-testid="word-tile"][data-row="0"]');
      for (const [at, mark] of markGuess(guess, puzzle.solution).entries()) await expect(row.nth(at)).toHaveAttribute("data-mark", mark);

      await page.keyboard.type(puzzle.solution);
      await page.keyboard.press("Enter");
      await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
      await expect(page.getByTestId("puzzle-paid")).toContainText(/XP|Already paid/);
    });
  });

  test("the play area's border and, in the Gomoku style, its four star points stand around six letters in every style", async ({ page }) => {
    await page.goto(`/games/${PUZZLE_SLUGS.gomoji}/play?size=${SIZE}&level=hard&seed=${freshPuzzleSeed()}`);
    await ready(page, "puzzle-play");
    for (const style of ["tiles", "reversi", "gomoku"] as const) {
      await page.getByTestId(`word-style-${style}`).click();
      await expect(page.getByTestId("puzzle-grid")).toHaveAttribute("data-style", style);
      await expect(page.getByTestId("word-play-border")).toHaveCount(1);
      await expect(page.getByTestId("word-star-point")).toHaveCount(style === "gomoku" ? 4 : 0);
      const border = (await page.getByTestId("word-play-border").boundingBox())!;
      const tiles = page.getByTestId("word-tile");
      const first = (await tiles.first().boundingBox())!;
      const last = (await tiles.last().boundingBox())!;
      expect(Math.abs(border.x + border.width / 2 - (first.x + last.x + last.width) / 2), `${style}: the border's middle is the tiles' middle`).toBeLessThan(2);
    }
    // Back, so the suite's operator is left drawing Reversi as it was.
    await page.getByTestId("word-style-reversi").click();
  });

  test.describe("in French and German, on a phone's keys", () => {
    // The on-screen keys carry German's Ä, Ö and Ü, and they are hidden by default on a desk's pointer.
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

    for (const kind of ["gomojiMot", "gomojiWort"] as const) {
      test(`${kind} opens at six letters and is found by its word`, async ({ page }) => {
        const level = "easy";
        const seed = freshPuzzleSeed();
        const puzzle = generatePuzzle(kind, SIZE, level, seed);
        await page.goto(`/games/${PUZZLE_SLUGS[kind]}/play?size=${SIZE}&level=${level}&seed=${seed}`);
        await ready(page, "puzzle-play");
        await expect(page.getByTestId("word-tile")).toHaveCount(SIZE * guessesFor("gomoji", SIZE, level, 0));
        for (const letter of puzzle.solution) await page.getByTestId(`word-key-${letter}`).click();
        await page.getByTestId("word-key-enter").click();
        await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
      });
    }
  });
});
