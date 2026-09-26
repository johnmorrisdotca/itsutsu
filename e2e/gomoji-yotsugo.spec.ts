import { expect, test } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { dayKeyOf } from "../src/lib/puzzles/dailyWords/dailyDay";
import { generatePuzzle, prepareEveryPuzzle } from "../src/lib/puzzles/generate";
import { isWord } from "../src/lib/puzzles/gomoji/code";
import { hiddenWordsOf } from "../src/lib/puzzles/gomoji/futago";
import { freshYotsugoSeed, yotsugoDailySeed } from "../src/lib/puzzles/gomoji/yotsugoSeed";
import { tapKana } from "./kanaTyping";
import { ready } from "./support";

/**
 * GOMOJI YOTSUGO 四つ子: four hidden words at once (`yotsugo.ts`), the four
 * quarters of one board, every key split into the same four quarters, nine
 * guesses for five letters. Chosen on the set-up screen beside Futago, carried
 * in the address, played in letters and in kana, with four words of the day.
 *
 * The words are read from the same pure code the site generates them with, and
 * `freshYotsugoSeed` draws a seed nobody else's spec will ask for.
 */
const AT = `/games/${PUZZLE_SLUGS.gomoji}`;

test.beforeAll(prepareEveryPuzzle);

/** A fresh Yotsugo whose four words leave a real five-letter miss, sharing no letter with any of them. */
function yotsugoWithAMiss(): { seed: number; words: string[]; miss: string } {
  for (;;) {
    const seed = freshYotsugoSeed();
    const words = [...hiddenWordsOf("gomoji", 5, generatePuzzle("gomoji", 5, "easy", seed).givens)!.words];
    const miss = ["jumpy", "fizzy", "whisk", "gawky", "vouch", "blitz", "chump", "fjord", "mound", "crypt", "dwarf", "nymph", "glyph", "psych"].find(
      (each) => isWord(each, 5) && [...each].every((letter) => words.every((word) => !word.includes(letter))),
    );
    if (miss !== undefined) return { seed, words, miss };
  }
}

test.describe("Gomoji Yotsugo", () => {
  test("is chosen on the set-up screen, kept in the address, and opens four boards", async ({ page }) => {
    await page.goto(`${AT}/new`);
    await ready(page, "puzzle-set-up");
    await expect(page.getByTestId("puzzle-futago-off")).toHaveAttribute("aria-checked", "true");
    await page.getByTestId("puzzle-yotsugo-on").click();
    await expect(page.getByTestId("puzzle-yotsugo-on")).toHaveAttribute("aria-checked", "true");
    await expect(page.getByTestId("puzzle-futago-blurb")).toContainText("Four hidden words");
    await expect(page.getByTestId("set-up-yotsugo-preview")).toBeVisible();
    await expect(page.getByTestId("puzzle-solve")).toHaveAttribute("href", /four=1/);
    // A reload of the set-up keeps the choice, from the address.
    await expect(page).toHaveURL(/four=1/);
    await page.reload();
    await ready(page, "puzzle-set-up");
    await expect(page.getByTestId("puzzle-yotsugo-on")).toHaveAttribute("aria-checked", "true");

    await page.getByTestId("puzzle-solve").click();
    await expect(page).toHaveURL(/four=1|seed=10[3-9]\d{7}/);
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("futago-board")).toHaveCount(4);
    await expect(page.getByTestId("puzzle-asked-yotsugo")).toContainText("四つ子");
  });

  test("a guess goes to all four boards, each key shows four quarters, and a found board stops", async ({ page }) => {
    const { seed, words, miss } = yotsugoWithAMiss();
    await page.goto(`${AT}/play?size=5&level=hard&seed=${seed}`);
    await ready(page, "puzzle-play");
    const boards = page.getByTestId("futago-board");
    await expect(boards).toHaveCount(4);
    await expect(page.getByTestId("word-said")).toContainText("9 guesses left");

    await page.keyboard.type(miss);
    await page.keyboard.press("Enter");
    for (const at of [0, 1, 2, 3]) await expect(boards.nth(at).locator('[data-testid="word-tile"][data-row="0"]')).toHaveCount(5);
    await expect(page.getByTestId(`word-key-${miss[0]}`)).toHaveAttribute("data-mark", "miss|miss|miss|miss");
    await expect(page.getByTestId("yotsugo-key-quarters").first()).toBeVisible();

    // The third word: its board is found, the others play on.
    await page.keyboard.type(words[2]!);
    await page.keyboard.press("Enter");
    await expect(boards.nth(2)).toHaveAttribute("data-found", "true");
    await expect(boards.nth(0)).toHaveAttribute("data-found", "false");

    for (const word of [words[0]!, words[1]!, words[3]!]) {
      await page.keyboard.type(word);
      await page.keyboard.press("Enter");
    }
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
  });

  test("is played in kana too, on the kana keys", async ({ page }) => {
    const seed = freshYotsugoSeed();
    const hidden = hiddenWordsOf("gomojiKana", 3, generatePuzzle("gomojiKana", 3, "hard", seed).givens)!;
    await page.goto(`/games/${PUZZLE_SLUGS.gomojiKana}/play?size=3&level=hard&seed=${seed}`);
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("futago-board")).toHaveCount(4);
    for (const word of hidden.words) {
      await tapKana(page, word);
      await page.getByTestId("kana-key-enter").click();
    }
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
  });

  test("the front door offers today's four words at every length, and one opens four boards", async ({ page }) => {
    await page.goto(AT);
    const play = page.getByTestId("yotsugo-daily-play");
    await expect(play.first()).toBeVisible();
    await expect(play.first()).toHaveAttribute("href", new RegExp(`seed=${yotsugoDailySeed(dayKeyOf(new Date()))}|four=1.*daily=1`));
    await play.first().click();
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("futago-board")).toHaveCount(4);
  });
});
