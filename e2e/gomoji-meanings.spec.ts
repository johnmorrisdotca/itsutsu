import { expect, test, type Page } from "@playwright/test";
import { loadWords, withoutWords, wordsOf } from "@johnmorrisdotca/jisho/words";
import { markKanaGuess } from "@johnmorrisdotca/kotoba";

import { PUZZLE_SLUGS, playPath } from "../src/lib/gomoku/slugs";
import { generatePuzzle } from "../src/lib/puzzles/generate";
import { prepareEveryPuzzle } from "../src/lib/puzzles/prepareEvery";
import { decodeKanaGivens, KANA_ROWS } from "../src/lib/puzzles/gomojiKana/kanaCode";
import { kanaWordsOf } from "../src/lib/puzzles/gomojiKana/kanaWords";
import { KANA_MEANING_BLOCKED, meaningLine } from "../src/lib/puzzles/gomojiKana/meaningLine";
import { tapKana } from "./kanaTyping";
import { forgetLanguage, freshPuzzleSeed, ready } from "./support";
import { loadEveryWordList } from "./wordLists";

/**
 * WHAT A KANA GUESS MEANS, said quietly (John, 2026-11-02: "the user should be able to see what each guess means. Has to
 * be so subtle as to not ruin the UX."). A guessed row tapped puts "word: meaning" in the status line, which keeps its place
 * and its height; the hidden word's meaning is on the end card only once the round is over; a word with nothing quiet
 * to say shows nothing; and the dictionary is fetched, one small piece, only when somebody taps.
 *
 * Driven as a person does it: a tap on the row, the keys typed after it, on a phone's width and a desk's. The meanings
 * are worked out here from the same dictionary and the same rules the page uses, so the spec says what is expected
 * without copying a line of it.
 */
const KIND = "gomojiKana";
const PLAY = playPath(KIND);
const SIZE = 3;
const WIDTHS = [
  { name: "a small phone", width: 360, height: 780 },
  { name: "a phone", width: 390, height: 844 },
  { name: "a desk", width: 1280, height: 800 },
];

test.beforeAll(loadEveryWordList);
test.beforeAll(prepareEveryPuzzle);
test.beforeEach(async ({ page }) => {
  // The account keeps the language it was last given: this reads English.
  await forgetLanguage(page);
});

/** The line the page will say for a word, from the dictionary as a person's browser would be handed it. */
async function lineOf(word: string): Promise<string | null> {
  return meaningLine(word, withoutWords(wordsOf(await loadWords(word), word), KANA_MEANING_BLOCKED));
}

/** Easy words the list allows: the first with a line to say, and the first with none. */
async function guessable(not: readonly string[]): Promise<{ said: { word: string; line: string }[]; silent: string[] }> {
  const said: { word: string; line: string }[] = [];
  const silent: string[] = [];
  for (const word of kanaWordsOf(SIZE).easy) {
    if (not.includes(word)) continue;
    const line = await lineOf(word);
    if (line !== null && said.length < 3) said.push({ word, line });
    else if (line === null && silent.length < 2) silent.push(word);
    if (said.length >= 3 && silent.length >= 2) break;
  }
  return { said, silent };
}

/** A puzzle (by its seed) whose hidden word has a meaning to say, or has none. */
async function puzzleWhoseWord(has: boolean, level: "easy" | "hard" = "easy"): Promise<{ seed: number; word: string; grey: string; line: string | null }> {
  for (let tries = 0; tries < 400; tries += 1) {
    const seed = freshPuzzleSeed();
    const given = decodeKanaGivens(generatePuzzle(KIND, SIZE, level, seed).givens, SIZE)!;
    const line = await lineOf(given.word);
    if ((line !== null) === has) return { seed, word: given.word, grey: given.grey ?? "", line };
  }
  throw new Error(`no puzzle whose word ${has ? "has" : "has no"} a meaning`);
}

async function open(page: Page, seed: number, level: "easy" | "hard" = "easy") {
  await page.goto(`${PLAY}&size=${SIZE}&level=${level}&seed=${seed}`);
  await ready(page, "puzzle-play");
}

async function guess(page: Page, word: string) {
  await tapKana(page, word);
  await page.getByTestId("kana-key-enter").click();
}

/** Where the board, the status line and the keys are, to the pixel, for "nothing moved". */
async function where(page: Page) {
  const boxes = await Promise.all(["puzzle-grid", "word-said", "word-keys-box"].map((id) => page.getByTestId(id).boundingBox()));
  return boxes.map((box) => box && { x: box.x, y: box.y, width: box.width, height: box.height });
}

/** Responses of the dictionary's small pieces: a script that holds JMdict's rows (a ¦ between a sense's marks and its glosses). */
function watchPieces(page: Page): { count: () => number } {
  let pieces = 0;
  page.on("response", async (response) => {
    if (response.request().resourceType() !== "script") return;
    try {
      // A piece is a table of rows, each with a ¦ before its glosses; the module that reads them has the character once or twice.
      if (((await response.text()).match(/¦/g) ?? []).length > 50) pieces += 1;
    } catch {
      // A response that cannot be read again is not a piece we are counting.
    }
  });
  return { count: () => pieces };
}

for (const { name, width, height } of WIDTHS) {
  test.describe(`on ${name}`, () => {
    test.use({ viewport: { width, height } });

    test("a tapped guess says what it means, and nothing on the page moves", async ({ page }) => {
      const puzzle = await puzzleWhoseWord(true);
      const { said } = await guessable([puzzle.word, puzzle.grey]);
      const pieces = watchPieces(page);
      await open(page, puzzle.seed);
      const first = said[0]!;
      await guess(page, first.word);
      await expect(page.locator('[data-testid="word-tile"][data-row="1"]').first()).toHaveAttribute("data-lookable", "true");
      // Nothing of the dictionary was fetched by playing: only a tap asks for it.
      expect(pieces.count()).toBe(0);

      const before = await where(page);
      await page.locator('[data-testid="word-tile"][data-row="1"]').nth(1).click();
      await expect(page.getByTestId("word-said")).toHaveText(`${first.word}: ${first.line}`);
      expect(await where(page)).toEqual(before);
      // One small piece answered it, and a second tap on the same word fetches nothing more.
      expect(pieces.count()).toBe(1);
      await page.locator('[data-testid="word-tile"][data-row="1"]').nth(1).click();
      await expect(page.getByTestId("word-said")).not.toContainText(first.line);
      await page.locator('[data-testid="word-tile"][data-row="1"]').nth(2).click();
      await expect(page.getByTestId("word-said")).toHaveText(`${first.word}: ${first.line}`);
      expect(pieces.count()).toBe(1);
      expect(await where(page)).toEqual(before);

      // Another guess puts the line away, and its own tap says its own meaning.
      const second = said[1]!;
      await guess(page, second.word);
      await expect(page.getByTestId("word-said")).not.toContainText(first.line);
      await page.locator('[data-testid="word-tile"][data-row="2"]').first().click();
      await expect(page.getByTestId("word-said")).toHaveText(`${second.word}: ${second.line}`);
      expect(pieces.count()).toBe(2);
    });

    test("typing still works after a tap", async ({ page }) => {
      const puzzle = await puzzleWhoseWord(true);
      const { said } = await guessable([puzzle.word, puzzle.grey]);
      await open(page, puzzle.seed);
      await guess(page, said[0]!.word);
      await page.locator('[data-testid="word-tile"][data-row="1"]').first().click();
      await expect(page.getByTestId("word-said")).toContainText(said[0]!.line);
      // The keys under the board, then the desk's keyboard: both still type, and a word sent still counts.
      await tapKana(page, said[1]!.word);
      await expect(page.locator('[data-testid="word-tile"][data-row="2"]').first()).toHaveText([...said[1]!.word][0]!);
      await page.getByTestId("kana-key-enter").click();
      await expect(page.locator('[data-testid="word-tile"][data-row="2"]').first()).toHaveAttribute("data-mark", /hit|near|kin|miss/);
      await page.locator('[data-testid="word-tile"][data-row="2"]').first().focus();
      await page.keyboard.type("a");
      await expect(page.locator('[data-testid="word-tile"][data-row="3"]').first()).toHaveText("あ");
    });

    test("a word with nothing quiet to say shows nothing and leaves the line as it was", async ({ page }) => {
      const puzzle = await puzzleWhoseWord(true);
      const { silent } = await guessable([puzzle.word, puzzle.grey]);
      test.skip(silent.length === 0, "every easy word has a meaning");
      await open(page, puzzle.seed);
      await guess(page, silent[0]!);
      const before = await where(page);
      const said = await page.getByTestId("word-said").textContent();
      await page.locator('[data-testid="word-tile"][data-row="1"]').first().click();
      // Give the dictionary the time it needs, then see that it said nothing and that nothing moved.
      await page.waitForTimeout(1500);
      expect(await page.getByTestId("word-said").textContent()).toBe(said);
      expect(await where(page)).toEqual(before);
    });

    test("the hidden word's meaning is not on the page before the end, and is on the end card after", async ({ page }) => {
      const puzzle = await puzzleWhoseWord(true);
      const { said } = await guessable([puzzle.word, puzzle.grey]);
      await open(page, puzzle.seed);
      await guess(page, said[0]!.word);
      await expect(page.getByTestId("word-meaning")).toHaveCount(0);
      await expect(page.locator("main")).not.toContainText(puzzle.line!);
      await guess(page, puzzle.word);
      await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
      await expect(page.getByTestId("word-meaning-line")).toHaveText(`${puzzle.word}: ${puzzle.line}`);
    });

    test("a lost round shows the word's meaning on the answer card, in the room kept for it", async ({ page }) => {
      const puzzle = await puzzleWhoseWord(true, "hard");
      await open(page, puzzle.seed, "hard");
      const wrong = kanaWordsOf(SIZE).easy.filter((word) => word !== puzzle.word && markKanaGuess([...word], [...puzzle.word]).every((mark) => mark.mark === "miss" || mark.mark === "kin")).slice(0, KANA_ROWS);
      for (const word of wrong) await guess(page, word);
      await expect(page.getByTestId("word-out-card")).toBeVisible();
      await expect(page.getByTestId("word-meaning-line")).toHaveText(`${puzzle.word}: ${puzzle.line}`);
    });
  });
}

test("the colour guide says a guess can be tapped, in kana Gomoji only", async ({ page }) => {
  const puzzle = await puzzleWhoseWord(true);
  await open(page, puzzle.seed);
  await page.getByTestId("word-help-open").click();
  await expect(page.getByTestId("word-help-tap")).toHaveText("Tap a guess to see what its word means.");
});
