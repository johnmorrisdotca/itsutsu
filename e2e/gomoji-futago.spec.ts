import { expect, test } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { dayKeyOf } from "../src/lib/puzzles/dailyWords/dailyDay";
import { generatePuzzle, prepareEveryPuzzle } from "../src/lib/puzzles/generate";
import { isWord } from "../src/lib/puzzles/gomoji/code";
import { hiddenWordsOf } from "../src/lib/puzzles/gomoji/futago";
import { freshFutagoSeed, futagoDailySeed } from "../src/lib/puzzles/gomoji/futagoSeed";
import { tapKana } from "./kanaTyping";
import { ready } from "./support";

/**
 * GOMOJI FUTAGO 双子: two hidden words at once (`futago.ts`). Every guess goes
 * to both boards until a board's word is found, and each key is split in two,
 * the first board's colour on its left and the second's on its right. Chosen
 * on the set-up screen, played by the same keys as one word, in letters and in
 * kana, with two words of the day on the front door.
 *
 * The words are read from the same pure code the site generates them with, so
 * nothing here depends on what a database holds. A Futago's seeds are a block
 * of their own (`futagoSeed.ts`), and `freshFutagoSeed` draws one nobody else's
 * spec will ask for.
 */
const AT = `/games/${PUZZLE_SLUGS.gomoji}`;

test.beforeAll(prepareEveryPuzzle);

/** A real five-letter word sharing no letter with either hidden word, so every key it presses must turn grey on both halves. */
function sharedWithNeither(words: readonly string[]): string | undefined {
  return ["jumpy", "fizzy", "whisk", "gawky", "vouch", "blitz", "chump", "fjord", "mound", "crypt", "dwarf", "nymph"].find(
    (each) => isWord(each, 5) && [...each].every((letter) => words.every((word) => !word.includes(letter))),
  );
}

/**
 * A fresh Futago whose two words leave a miss to guess. Some pairs leave none
 * ("bring" and "cruel" between them use every vowel the list has), which made
 * a random seed fail now and then; so draw until one does, still fresh.
 */
function futagoWithAMiss(): { seed: number; puzzle: ReturnType<typeof generatePuzzle>; words: [string, string]; miss: string } {
  for (;;) {
    const seed = freshFutagoSeed();
    const puzzle = generatePuzzle("gomoji", 5, "easy", seed);
    const words = hiddenWordsOf("gomoji", 5, puzzle.givens)!.words as [string, string];
    const miss = sharedWithNeither(words);
    if (miss !== undefined) return { seed, puzzle, words, miss };
  }
}

test.describe("Gomoji Futago", () => {
  test("is chosen on the set-up screen and opens two boards, said in the header", async ({ page }) => {
    await page.goto(`${AT}/new`);
    await ready(page, "puzzle-set-up");
    await page.getByTestId("puzzle-level-easy").click();
    await expect(page.getByTestId("puzzle-futago-off")).toHaveAttribute("aria-checked", "true");
    await page.getByTestId("puzzle-futago-on").click();
    await expect(page.getByTestId("puzzle-futago-on")).toHaveAttribute("aria-checked", "true");
    await expect(page.getByTestId("puzzle-futago-blurb")).toContainText("Two hidden words");
    await expect(page.getByTestId("set-up-futago-preview")).toBeVisible();
    await page.getByTestId("puzzle-solve").click();

    await expect(page).toHaveURL(/twins=1|seed=10[01]\d{7}/);
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("futago-board")).toHaveCount(2);
    await expect(page.getByTestId("puzzle-asked-futago")).toContainText("双子");
  });

  test("a guess goes to both boards, each key shows both, and each board stops when its word is found", async ({ page }) => {
    const { seed, words: [first, second], miss } = futagoWithAMiss();
    await page.goto(`${AT}/play?size=5&level=easy&seed=${seed}`);
    await ready(page, "puzzle-play");
    const boards = page.getByTestId("futago-board");
    await expect(boards).toHaveCount(2);

    // A miss on both: written on both boards, and every key it pressed grey on both halves.
    await page.keyboard.type(miss);
    await page.keyboard.press("Enter");
    for (const at of [0, 1]) await expect(boards.nth(at).locator('[data-testid="word-tile"][data-row="0"]')).toHaveCount(5);
    for (const letter of new Set(miss)) await expect(page.getByTestId(`word-key-${letter}`)).toHaveAttribute("data-mark", "miss|miss");

    // The first word: its board is found and keeps its rows, the other plays on.
    await page.keyboard.type(first);
    await page.keyboard.press("Enter");
    await expect(boards.nth(0)).toHaveAttribute("data-found", "true");
    await expect(boards.nth(0).getByTestId("futago-board-state")).toContainText("Found in 2");
    await expect(boards.nth(1)).toHaveAttribute("data-found", "false");
    await expect(page.getByTestId(`word-key-${first[0]}`)).toHaveAttribute("data-mark", /^hit\|/);

    // The second word: a guess more on its board than on the first, and the puzzle is solved.
    await page.keyboard.type(second);
    await page.keyboard.press("Enter");
    await expect(boards.nth(1)).toHaveAttribute("data-found", "true");
    // The found board took nothing more: its third row is drawn, and empty, while the other's holds the word.
    await expect(boards.nth(1).locator('[data-testid="word-tile"][data-row="2"][data-mark="hit"]')).toHaveCount(5);
    await expect(boards.nth(0).locator('[data-testid="word-tile"][data-row="2"]:not([data-mark="empty"])')).toHaveCount(0);
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
  });

  test("is played in kana too, on the kana keys", async ({ page }) => {
    const seed = freshFutagoSeed();
    const puzzle = generatePuzzle("gomojiKana", 3, "easy", seed);
    const hidden = hiddenWordsOf("gomojiKana", 3, puzzle.givens)!;
    expect(hidden.words).toHaveLength(2);
    await page.goto(`/games/${PUZZLE_SLUGS.gomojiKana}/play?size=3&level=easy&seed=${seed}`);
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("futago-board")).toHaveCount(2);
    for (const word of hidden.words) {
      await tapKana(page, word);
      await page.getByTestId("kana-key-enter").click();
    }
    await expect(page.getByTestId("futago-board").nth(1)).toHaveAttribute("data-found", "true");
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
  });

  test("the front door offers today's two words at every length, and one opens two boards", async ({ page }) => {
    await page.goto(AT);
    const play = page.getByTestId("futago-daily-play");
    await expect(play.first()).toBeVisible();
    // Read before or after the member's statuses arrive: the dated seed, or the shell's ask for today's.
    await expect(play.first()).toHaveAttribute("href", new RegExp(`seed=${futagoDailySeed(dayKeyOf(new Date()))}|twins=1.*daily=1`));
    await play.first().click();
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("futago-board")).toHaveCount(2);
  });
});
