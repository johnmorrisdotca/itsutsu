import { expect, test, type Page } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generatePuzzle, prepareEveryPuzzle } from "../src/lib/puzzles/generate";
import { isWord, markGuess } from "../src/lib/puzzles/gomoji/code";
import { hiddenWordsOf, wordsShown } from "../src/lib/puzzles/gomoji/futago";
import { freshYotsugoSeed, yotsugoDailySeed } from "../src/lib/puzzles/gomoji/yotsugoSeed";
import { dayKeyOf } from "../src/lib/puzzles/dailyWords/dailyDay";
import { letterKeyMarks } from "../src/lib/puzzles/keyMarks";
import { tapKana } from "./kanaTyping";
import { ready } from "./support";
import { loadEveryWordList } from "./wordLists";

// Words worked out here, in node, need Gomoji's lists loaded (`wordLists.ts`).
test.beforeAll(loadEveryWordList);
test.beforeAll(prepareEveryPuzzle);

/**
 * GOMOJI YOTSUGO 四つ子: four hidden words at once (`yotsugo.ts`), in the four
 * quarters of two boards. Every guess goes to every quarter until the
 * quarter's word is found, and each key is split in four corners, one quarter's
 * colour each. Chosen on the set-up screen beside one word and Futago's two,
 * played by the same keys, kept when left half way.
 *
 * The words are read from the same pure code the site draws them with, so
 * nothing here depends on what a database holds; `freshYotsugoSeed` draws a
 * seed of the Yotsugo block nobody else's spec will ask for.
 */
const AT = `/games/${PUZZLE_SLUGS.gomoji}`;
const PHONE = { width: 390, height: 844 };

/** A fresh five-letter Yotsugo at hard (nine guesses), its four words, and a real word that is none of them to guess first. */
function freshYotsugo(): { seed: number; words: string[]; other: string } {
  const seed = freshYotsugoSeed();
  const puzzle = generatePuzzle("gomoji", 5, "hard", seed);
  const words = [...hiddenWordsOf("gomoji", 5, puzzle.givens)!.words];
  const other = ["crane", "pious", "blitz", "dwarf", "nymph", "vouch", "gawky"].find((each) => isWord(each, 5) && !words.includes(each))!;
  return { seed, words, other };
}

/** Types a guess on the desk's keyboard and sends it with Enter. */
async function guess(page: Page, word: string) {
  await page.keyboard.type(word);
  await page.keyboard.press("Enter");
}

test.describe("Gomoji Yotsugo", () => {
  test("is chosen on the set-up screen as a third choice, without moving the screen, and opens four quarters", async ({ page }) => {
    await page.setViewportSize(PHONE);
    await page.goto(`${AT}/new`);
    await ready(page, "puzzle-set-up");
    await page.getByTestId("puzzle-level-hard").click();
    await expect(page.getByTestId("puzzle-futago-off")).toHaveAttribute("aria-checked", "true");
    const chips = page.getByTestId("puzzle-futago");
    const blurb = page.getByTestId("puzzle-futago-blurb");
    const before = { chips: await chips.boundingBox(), blurb: await blurb.boundingBox(), preview: await page.getByTestId("set-up-puzzle-preview").boundingBox() };

    // Two words, then four: the same screen each time.
    await page.getByTestId("puzzle-futago-on").click();
    await expect(page.getByTestId("puzzle-futago-on")).toHaveAttribute("aria-checked", "true");
    const twins = { chips: await chips.boundingBox(), blurb: await blurb.boundingBox(), preview: await page.getByTestId("set-up-puzzle-preview").boundingBox() };
    await page.getByTestId("puzzle-yotsugo-on").click();
    await expect(page.getByTestId("puzzle-yotsugo-on")).toHaveAttribute("aria-checked", "true");
    await expect(page.getByTestId("puzzle-futago-off")).toHaveAttribute("aria-checked", "false");
    await expect(blurb).toContainText("Four hidden words, 9 guesses");
    await expect(page.getByTestId("set-up-yotsugo-preview")).toBeVisible();
    await expect(page.getByTestId("set-up-yotsugo-preview").getByTestId("word-part")).toHaveCount(4);
    // The preview is the same square, the chips the same row, the line under them the same room: nothing on the screen moved.
    const after = { chips: await chips.boundingBox(), blurb: await blurb.boundingBox(), preview: await page.getByTestId("set-up-puzzle-preview").boundingBox() };
    for (const [name, chosen] of [["two words", twins], ["four words", after]] as const) {
      for (const part of ["chips", "blurb", "preview"] as const) {
        expect(chosen[part]!.height, `${part} changed height at ${name}`).toBeCloseTo(before[part]!.height, 0);
        expect(chosen[part]!.y, `${part} moved at ${name}`).toBeCloseTo(before[part]!.y, 0);
      }
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(PHONE.width);

    await page.getByTestId("puzzle-solve").click();
    await expect(page).toHaveURL(/quadruplets=1|seed=10[34]\d{7}/);
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("word-board-pair")).toHaveCount(2);
    await expect(page.getByTestId("word-part")).toHaveCount(4);
    await expect(page.getByTestId("puzzle-asked-yotsugo")).toContainText("四つ子");
    // Nine guesses at hard, each quarter a row for each.
    await expect(page.locator('[data-testid="word-part"][data-part="3"] [data-testid="word-tile"]')).toHaveCount(5 * 9);
  });

  test("a guess goes to every quarter, each key shows all four, each quarter stops when its word is found, and all four solve it", async ({ page }) => {
    const { seed, words, other } = freshYotsugo();
    await page.setViewportSize(PHONE);
    await page.goto(`${AT}/play?size=5&level=hard&seed=${seed}`);
    await ready(page, "puzzle-play");
    const quarter = (at: number) => page.locator(`[data-testid="word-part"][data-part="${at}"]`);
    await expect(page.getByTestId("word-part")).toHaveCount(4);

    // A word that is none of the four: written in every quarter, each marked against its own word.
    await guess(page, other);
    for (const [at, word] of words.entries()) {
      const marks = markGuess(other, word);
      for (const [place, mark] of marks.entries()) {
        await expect(quarter(at).locator(`[data-testid="word-tile"][data-row="0"]`).nth(place)).toHaveAttribute("data-mark", mark);
      }
    }
    // Every key it pressed carries four corners, each what its quarter's guesses say of the letter.
    for (const letter of new Set(other)) {
      const expected = words.map((word) => letterKeyMarks([other], word).get(letter) ?? "").join("|");
      await expect(page.getByTestId(`word-key-${letter}`)).toHaveAttribute("data-mark", expected);
      await expect(page.getByTestId(`word-key-${letter}`).locator('[data-testid="futago-key-halves"] > span')).toHaveCount(4);
    }
    // The key says the same in words, for a reader who cannot tell the colours apart.
    await expect(page.getByTestId(`word-key-${other[0]}`)).toHaveAttribute("aria-label", /first word: .*; second word: .*; third word: .*; fourth word: /);

    // The first word: its quarter is found and keeps its rows; the others play on.
    await guess(page, words[0]!);
    await expect(quarter(0)).toHaveAttribute("data-found", "true");
    await expect(page.locator('[data-testid="word-part-state"][data-part="0"]')).toContainText("Found in 2");
    for (const at of [1, 2, 3]) await expect(quarter(at)).toHaveAttribute("data-found", "false");

    // The second: its quarter holds it on the third row, and the first quarter took nothing more.
    await guess(page, words[1]!);
    await expect(quarter(1).locator('[data-testid="word-tile"][data-row="2"][data-mark="hit"]')).toHaveCount(5);
    await expect(quarter(0).locator('[data-testid="word-tile"][data-row="2"]:not([data-mark="empty"])')).toHaveCount(0);
    await expect(quarter(1)).toHaveAttribute("data-found", "true");

    // The last two, and it is solved: four quarters found, the replay in the board's place.
    await guess(page, words[2]!);
    await expect(quarter(2)).toHaveAttribute("data-found", "true");
    expect(await page.evaluate(() => document.documentElement.scrollWidth), "a four-word board wider than a phone").toBeLessThanOrEqual(PHONE.width);
    await guess(page, words[3]!);
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
    await expect(page.getByTestId("word-replay").getByTestId("word-part")).toHaveCount(4);
  });

  test("left half way for another game, it waits in My games and opens where it was left", async ({ page }) => {
    const { seed, other } = freshYotsugo();
    await page.goto(`${AT}/play?size=5&level=hard&seed=${seed}`);
    await ready(page, "puzzle-play");
    await guess(page, other);
    await expect(page.locator('[data-testid="word-part"][data-part="3"] [data-testid="word-tile"][data-row="0"]').first()).toHaveAttribute("data-mark", /^(hit|near|miss)$/);

    // Left by the site's own navigation, half way, and another game begun.
    await page.getByRole("navigation").getByRole("link", { name: /^My games/ }).first().click();
    await expect(page).toHaveURL(/\/play$/);
    await page.goto(`/games/${PUZZLE_SLUGS.numberPlace}/play?size=4&level=easy`);
    await ready(page, "puzzle-play");

    // And from that game, back through My games.
    await page.getByRole("navigation").getByRole("link", { name: /^My games/ }).first().click();
    await expect(page).toHaveURL(/\/play$/);
    await ready(page, "tabs");
    await page.locator('[data-testid="tab"][data-tab="going"]').click();
    const row = page.locator(`[data-testid="puzzle-going"][data-seed="${seed}"]`);
    await expect(row, "the Yotsugo left half way is not in My games").toBeVisible();
    await row.getByTestId("puzzle-going-continue").click();
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("puzzle-asked-yotsugo")).toBeVisible();
    for (const at of [0, 1, 2, 3]) {
      await expect(page.locator(`[data-testid="word-part"][data-part="${at}"] [data-testid="word-tile"][data-row="0"]`).first()).toHaveAttribute("aria-label", new RegExp(`^${other[0]!.toUpperCase()},`));
    }
  });

  test("is played in kana too, on the kana keys", async ({ page }) => {
    const seed = freshYotsugoSeed();
    const puzzle = generatePuzzle("gomojiKana", 3, "easy", seed);
    const hidden = hiddenWordsOf("gomojiKana", 3, puzzle.givens)!;
    expect(hidden.words).toHaveLength(4);
    await page.goto(`/games/${PUZZLE_SLUGS.gomojiKana}/play?size=3&level=easy&seed=${seed}`);
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("word-part")).toHaveCount(4);
    for (const word of hidden.words) {
      await tapKana(page, word);
      await page.getByTestId("kana-key-enter").click();
    }
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
  });

  test("the front door offers today's four words at every length, and one opens four quarters", async ({ page }) => {
    await page.goto(AT);
    const play = page.getByTestId("yotsugo-daily-play");
    await expect(play.first()).toBeVisible();
    // Read before or after the member's statuses arrive: the dated seed, or the shell's ask for today's.
    await expect(play.first()).toHaveAttribute("href", new RegExp(`seed=${yotsugoDailySeed(dayKeyOf(new Date()))}|quadruplets=1.*daily=1`));
    await play.first().click();
    await ready(page, "puzzle-play");
    await expect(page).toHaveURL(new RegExp(`seed=${yotsugoDailySeed(dayKeyOf(new Date()))}`));
    await expect(page.getByTestId("word-part")).toHaveCount(4);
  });

  test("on the Rabbit's minute, a Yotsugo runs out with a word found: all four shown, kept unsolved, and Another keeps four words and the clock", async ({ page }) => {
    await page.clock.install();
    await page.goto(`${AT}/new?size=5&level=hard`);
    await ready(page, "puzzle-set-up");
    await page.getByTestId("puzzle-yotsugo-on").click();
    await page.getByTestId("puzzle-clock-rabbit").click();
    await expect(page.getByTestId("puzzle-yotsugo-on")).toHaveAttribute("aria-checked", "true");
    await expect(page.getByTestId("puzzle-clock-rabbit")).toHaveAttribute("aria-checked", "true");
    await page.getByTestId("puzzle-solve").click();
    await expect(page).toHaveURL(/clock=rabbit/);
    await expect(page).toHaveURL(/seed=10[34]\d{7}/);
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("word-part")).toHaveCount(4);
    await expect(page.getByTestId("puzzle-clock")).toHaveText("1:00");

    // The seed the page drew says four words; the spec reads them from the same code.
    const seed = Number(await page.getByTestId("puzzle-play").getAttribute("data-seed"));
    const words = hiddenWordsOf("gomoji", 5, generatePuzzle("gomoji", 5, "hard", seed).givens)!.words;
    expect(words).toHaveLength(4);
    await guess(page, words[2]!);
    await expect(page.locator('[data-testid="word-part"][data-part="2"]')).toHaveAttribute("data-found", "true");

    await page.clock.runFor("01:01");
    await expect(page.getByTestId("word-out")).toBeVisible();
    await expect(page.getByTestId("puzzle-out-of-time")).toContainText("Out of time");
    await expect(page.getByTestId("word-was")).toHaveText(wordsShown("gomoji", words));
    await expect(page.getByTestId("word-replay").getByTestId("word-part")).toHaveCount(4);
    // Another is four more words on the same clock.
    await expect(page.getByTestId("word-another")).toHaveText(/Four more words/);
    await expect(page.getByTestId("word-another")).toHaveAttribute("href", /quadruplets=1.*clock=rabbit|clock=rabbit.*quadruplets=1/);

    // Kept among the finished puzzles as not found, on the Rabbit, with its four words.
    await page.getByTestId("word-kept").getByRole("link", { name: "My games" }).click();
    const kept = page.locator('[data-testid="puzzle-solved"][data-kind="gomoji"][data-solved="false"]').first();
    await expect(kept).toContainText("Not found");
    await expect(kept).toContainText("rabbit");
    // Opened, it is the four words, on the Rabbit.
    await kept.getByTestId("puzzle-solved-open").click();
    await expect(page.getByTestId("solve-word")).toHaveText(`${wordsShown("gomoji", words)} (Yotsugo 四つ子)`);
    await expect(page.getByTestId("solve-clock")).toContainText("Rabbit");
  });
});
