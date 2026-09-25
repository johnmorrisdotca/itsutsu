import { expect, test } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generatePuzzle, prepareEveryPuzzle } from "../src/lib/puzzles/generate";
import { decodeKanaGivens, KANA_ROWS } from "../src/lib/puzzles/wordDropKana/kanaCode";
import { markKanaGuess } from "../src/lib/puzzles/wordDropKana/kanaMarks";
import { kanaScore } from "../src/lib/puzzles/wordDropKana/kanaScore";
import { kanaWordsOf } from "../src/lib/puzzles/wordDropKana/kanaWords";
import { tapKana } from "./kanaTyping";
import { freshPuzzleSeed, ready } from "./support";

/**
 * WordDrop in kana (docs/plans/other/WORD-04-kana.md): a word of kana found
 * in six guesses, coloured by John's rules — green, orange, yellow for the
 * column, grey, and an arrow for the wrong size or mark — after a free first
 * word that is grey everywhere, on easy and medium. Typed on the kana keys, as
 * a phone is used, or in romaji on the desk; JMdict is credited on the page.
 */
const KIND = "wordDropKana";
const AT = `/games/${PUZZLE_SLUGS[KIND]}`;

test.beforeAll(prepareEveryPuzzle);

test.describe("the kana word puzzle", () => {
  test("its front door names it and its family", async ({ page }) => {
    await page.goto(AT);
    await expect(page.getByTestId("game-front-door").getByRole("heading", { level: 1 })).toContainText("WordDrop Kana");
    await expect(page.getByTestId("game-family")).toContainText("Other");
  });

  test("opens with a free word grey everywhere, colours a guess by the rules, and is found in kana", async ({ page }) => {
    const seed = freshPuzzleSeed();
    const puzzle = generatePuzzle(KIND, 3, "easy", seed);
    const { word, grey } = decodeKanaGivens(puzzle.givens, 3)!;
    await page.goto(`${AT}/play?size=3&level=easy&seed=${seed}`);
    await ready(page, "puzzle-play");

    // The free row: the grey word, every place grey, said to be given.
    const free = page.locator('[data-testid="word-tile"][data-free="true"]');
    await expect(free).toHaveCount(3);
    for (let at = 0; at < 3; at += 1) await expect(free.nth(at)).toHaveAttribute("data-mark", "miss");
    await expect(free.first()).toHaveAttribute("aria-label", new RegExp(`^${[...grey!][0]}, `));

    // A guess, tapped on the kana keys, and its colours and arrows read off the grid as the rules give them.
    const guess = kanaWordsOf(3).easy.find((each) => each !== word && markKanaGuess([...each], [...word]).some((mark) => mark.mark !== "miss"))!;
    await tapKana(page, guess);
    await page.getByTestId("kana-key-enter").click();
    const expected = markKanaGuess([...guess], [...word]);
    const row = page.locator('[data-testid="word-tile"][data-row="1"]');
    for (const [at, mark] of expected.entries()) {
      await expect(row.nth(at)).toHaveAttribute("data-mark", mark.mark);
      const arrow = mark.wrongSize && mark.wrongMark ? "↓↑" : mark.wrongSize ? "↓" : mark.wrongMark ? "↑" : null;
      if (arrow === null) await expect(row.nth(at)).not.toHaveAttribute("data-arrow", /./);
      else await expect(row.nth(at)).toHaveAttribute("data-arrow", arrow);
    }

    // The word itself.
    await tapKana(page, word);
    await page.getByTestId("kana-key-enter").click();
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
    await expect(page.getByTestId("kana-credit")).toContainText("JMdict");
  });

  test("romaji typed on the desk becomes kana, the sound being typed waiting beside the prompt", async ({ page }) => {
    await page.goto(`${AT}/play?size=4&level=medium&seed=${freshPuzzleSeed()}`);
    await ready(page, "puzzle-play");
    const place = (at: number) => page.locator('[data-testid="word-tile"][data-row="1"]').nth(at);
    await page.keyboard.type("k");
    await expect(page.getByTestId("kana-romaji")).toHaveText("k…");
    await page.keyboard.type("yo");
    await expect(place(0)).toHaveAttribute("aria-label", /^き, /);
    await expect(place(1)).toHaveAttribute("aria-label", /^ょ, /);
    await page.keyboard.type("u");
    await expect(place(2)).toHaveAttribute("aria-label", /^う, /);
    await expect(page.getByTestId("kana-romaji")).toHaveCount(0);
  });

  test("hard opens with no free word", async ({ page }) => {
    await page.goto(`${AT}/play?size=4&level=hard&seed=${freshPuzzleSeed()}`);
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("word-tile")).toHaveCount(4 * KANA_ROWS);
    await expect(page.locator('[data-testid="word-tile"][data-free="true"]')).toHaveCount(0);
  });

  test("six words that miss end it, show the word and score what they found", async ({ page }) => {
    const seed = freshPuzzleSeed();
    const puzzle = generatePuzzle(KIND, 3, "hard", seed);
    await page.goto(`${AT}/play?size=3&level=hard&seed=${seed}`);
    await ready(page, "puzzle-play");
    // Six real words none of which is the word; on hard, none may drop a kana an earlier one found, so they find nothing.
    const wrong = kanaWordsOf(3).easy.filter((word) => markKanaGuess([...word], [...puzzle.solution]).every((mark) => mark.mark === "miss" || mark.mark === "kin")).slice(0, KANA_ROWS);
    for (const word of wrong) {
      await tapKana(page, word);
      await page.getByTestId("kana-key-enter").click();
    }
    await expect(page.getByTestId("word-out")).toBeVisible();
    await expect(page.getByTestId("word-was")).toHaveText(puzzle.solution);
    await expect(page.getByTestId("word-score")).toHaveAttribute("data-total", String(kanaScore(puzzle.solution, wrong, KANA_ROWS, 0).total));
  });
});
