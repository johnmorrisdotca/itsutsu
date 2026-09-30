import { expect, test, type Page } from "@playwright/test";

import { joinQuery, playPath } from "../src/lib/gomoku/slugs";
import { generatePuzzle } from "../src/lib/puzzles/generate";
import { prepareEveryPuzzle } from "../src/lib/puzzles/prepareEvery";
import { hiddenWordsOf } from "../src/lib/puzzles/gomoji/futago";
import { freshFutagoSeed } from "../src/lib/puzzles/gomoji/futagoSeed";
import type { WordCount } from "../src/lib/puzzles/gomoji/words.types";
import { freshYotsugoSeed } from "../src/lib/puzzles/gomoji/yotsugoSeed";
import { tapKana } from "./kanaTyping";
import { freshPuzzleSeed, ready } from "./support";
import { loadEveryWordList } from "./wordLists";

test.beforeAll(loadEveryWordList);
test.beforeAll(prepareEveryPuzzle);

/**
 * EVERY LETTER INSIDE ITS SQUARE, AND THE SQUARES BIG ENOUGH TO READ.
 *
 * John, 2026-09-28, with a two-word game on his iPhone: "our [two-word
 * Gomoji] is bad. So small. It's hard to see and the letters are too big or
 * squares are too small." The two words sat on two whole boards side by side,
 * fifteen-pixel squares, and a fixed twenty-pixel letter spilled out of each.
 * Measured here as boxes on a 390-pixel phone with its keys showing, for one
 * word, two and four, in letters and in kana: every letter's box — the line of
 * text it takes, not only its ink — inside its square, and every square at
 * least `LEAST_SQUARE_ONE` for one word (one word's five-letter board, 34
 * pixels, as it stood before) and `LEAST_SQUARE_MANY` for several (a Futago or
 * Yotsugo of six letters, the widest board, 26 pixels; five letters are 31).
 */
const PHONE = { width: 390, height: 844 };
const LEAST_SQUARE_ONE = 34;
const LEAST_SQUARE_MANY = 25;

type Case = { kind: "gomoji" | "gomojiKana"; size: number; words: WordCount };
const CASES: readonly Case[] = [
  { kind: "gomoji", size: 4, words: 1 },
  { kind: "gomoji", size: 5, words: 1 },
  { kind: "gomoji", size: 6, words: 1 },
  { kind: "gomoji", size: 5, words: 2 },
  { kind: "gomoji", size: 6, words: 2 },
  { kind: "gomoji", size: 5, words: 4 },
  { kind: "gomoji", size: 6, words: 4 },
  { kind: "gomojiKana", size: 5, words: 1 },
  { kind: "gomojiKana", size: 5, words: 2 },
  { kind: "gomojiKana", size: 5, words: 4 },
];

/** Real words to guess that none of these puzzles hides, by length. */
const GUESSES: Record<number, string[]> = { 4: ["tree", "moon"], 5: ["crane", "pious"], 6: ["planet", "stream"] };

/** Every letter on the board being played: its square, and the box its text takes. */
async function lettersOf(page: Page) {
  return page.locator('[data-testid="puzzle-play"] [data-testid="word-tile"]').evaluateAll((tiles) =>
    tiles.flatMap((tile) => {
      const square = tile.getBoundingClientRect();
      const walker = document.createTreeWalker(tile, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
        if ((node.textContent ?? "").trim() === "") continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        const text = range.getBoundingClientRect();
        return [{ square: { left: square.left, right: square.right, top: square.top, bottom: square.bottom, side: Math.min(square.width, square.height) }, text: { left: text.left, right: text.right, top: text.top, bottom: text.bottom } }];
      }
      return [];
    }),
  );
}

test.describe("Gomoji's letters on a phone", () => {
  test.use({ viewport: PHONE, hasTouch: true, isMobile: true });

  for (const each of CASES) {
    test(`${each.kind} of ${each.size}, ${each.words} word${each.words > 1 ? "s" : ""}: every letter inside its square, and the squares big enough to read`, async ({ page }) => {
      const seed = each.words === 4 ? freshYotsugoSeed() : each.words === 2 ? freshFutagoSeed() : freshPuzzleSeed();
      const puzzle = generatePuzzle(each.kind, each.size, "medium", seed);
      const words = hiddenWordsOf(each.kind, each.size, puzzle.givens)!.words;
      await page.goto(joinQuery(playPath(each.kind), `?size=${each.size}&level=medium&seed=${seed}`));
      await ready(page, "puzzle-play");
      // Measured on the default style, whatever an earlier spec left on the account (dark-tiles chooses Tiles, whose squares are smaller).
      await page.getByTestId("word-style-reversi").click();
      await expect(page.getByTestId("word-style-reversi")).toHaveAttribute("aria-pressed", "true");
      // The phone's keys showing, as a player has them.
      const keys = page.getByTestId("word-keys-box");
      if (!(await keys.isVisible())) await page.getByTestId("word-keys-toggle").click();
      await expect(keys).toBeVisible();

      // Letters on the board: marked guesses, and a row being typed.
      if (each.kind === "gomojiKana") {
        if (words.length > 1) {
          await tapKana(page, words[1]!);
          await page.getByTestId("kana-key-enter").click();
        }
        await tapKana(page, [...words[0]!].slice(0, 2).join(""));
      } else {
        const [first, second] = GUESSES[each.size]!.filter((word) => !words.includes(word));
        for (const guess of [first!, ...(words.length > 1 ? [words[1]!] : [])]) {
          await page.keyboard.type(guess);
          await page.keyboard.press("Enter");
        }
        await page.keyboard.type(second!.slice(0, 2));
      }
      await expect(page.locator('[data-testid="puzzle-play"] [data-testid="word-tile"][data-mark="typed"]').first()).toBeVisible();

      const letters = await lettersOf(page);
      expect(letters.length).toBeGreaterThan(each.size);
      const least = each.words === 1 ? LEAST_SQUARE_ONE : LEAST_SQUARE_MANY;
      for (const { square, text } of letters) {
        expect(square.side, `a square of ${square.side.toFixed(1)}px`).toBeGreaterThanOrEqual(least);
        expect(text.left, "a letter out of its square on the left").toBeGreaterThanOrEqual(square.left - 0.5);
        expect(text.right, "a letter out of its square on the right").toBeLessThanOrEqual(square.right + 0.5);
        expect(text.top, "a letter out of its square at the top").toBeGreaterThanOrEqual(square.top - 0.5);
        expect(text.bottom, "a letter out of its square at the bottom").toBeLessThanOrEqual(square.bottom + 0.5);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth), "the board wider than the phone").toBeLessThanOrEqual(PHONE.width);
    });
  }
});
