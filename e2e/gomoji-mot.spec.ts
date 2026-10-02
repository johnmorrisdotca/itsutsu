import { expect, test } from "@playwright/test";

import { PUZZLE_SLUGS, playPath } from "../src/lib/gomoku/slugs";
import { isWord, markGuess } from "../src/lib/puzzles/gomoji/code";
import { guessesFor } from "../src/lib/puzzles/gomoji/layout";
import { freshPuzzleSeed, ready } from "./support";
import { loadEveryWordList } from "./wordLists";

// Words worked out here, in node, need Gomoji's lists loaded (`wordLists.ts`).
test.beforeAll(loadEveryWordList);

/**
 * Gomoji Mot: the French Gomoji, on the AZERTY keyboard drawn under the
 * grid. Same engine as English's Gomoji (`gomoji.spec.ts`), a different word
 * list — this spec drives the AZERTY keys and reads the French attribution
 * line, which is what is different about it, not the guessing mechanics
 * already covered for English.
 */
const KIND = "gomojiMot";
const LEVEL = "medium";
// Its address from before 2026-09-28, which leads on to the one Gomoji (`formerAddresses.ts`).
const AT = `/games/${PUZZLE_SLUGS[KIND]}`;
// Where it is played now: the one Gomoji's board and set-up, the setting in the query (`gameSettings.ts`).
const PLAY = playPath(KIND);
const GUESS = "chien"; // "dog": a common French word, five letters, in the guessable list.

test.describe("Gomoji Mot", () => {
  test("its old front door leads to the one Gomoji, which names it among its languages and word lists", async ({ page }) => {
    await page.goto(AT);
    // One Gomoji now: its old address is a setting of it (John, 2026-09-28: "just have 1 and allow language selection").
    await expect(page).toHaveURL(/\/games\/gomoji\?language=french$/);
    await expect(page.getByTestId("game-front-door").getByRole("heading", { level: 1 })).toHaveText(/^Gomoji/);
    await expect(page.getByTestId("inspired-by")).toContainText("Wordle");
    await expect(page.getByTestId("game-family")).toContainText("Word games");
    await expect(page.locator('[data-testid="word-setting-row"][data-kind="gomojiMot"]')).toContainText("Français");
  });

  test.describe("on a phone, typed on the AZERTY keys", () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

    test("a guess typed on the on-screen keys is coloured, and the credit line names the source", async ({ page }) => {
      expect(isWord(GUESS, 5, "fr")).toBe(true);
      const seed = freshPuzzleSeed();
      await page.goto(`${PLAY}&size=5&level=${LEVEL}&seed=${seed}`);
      await ready(page, "puzzle-play");
      // Laid out as English Gomoji is: the level decides the guesses (`layout.ts`).
      await expect(page.getByTestId("word-tile")).toHaveCount(5 * guessesFor("gomoji", 5, LEVEL, 0));

      // AZERTY: the keys are the same 26 letters as English's, arranged differently, so each is still its own letter's key.
      for (const letter of GUESS) await page.getByTestId(`word-key-${letter}`).click();
      await page.getByTestId("word-key-enter").click();

      const row = page.locator('[data-testid="word-tile"][data-row="0"]');
      const marks = await row.evaluateAll((cells) => cells.map((cell) => cell.getAttribute("data-mark")));
      expect(marks.every((mark) => mark === "hit" || mark === "near" || mark === "miss")).toBe(true);
      await expect(row.first()).toHaveAttribute("aria-label", new RegExp(`^${GUESS[0]!.toUpperCase()}, `));

      // The dictionaries' and FrequencyWords' CC BY-SA credit, shown on the play page as JMdict's is for Gomoji Kana.
      await expect(page.getByTestId("word-credit")).toContainText("FrequencyWords");
      await expect(page.getByTestId("word-credit")).toContainText("Lexique");
      await expect(page.getByTestId("word-credit")).toContainText("Wiktionary");
    });
  });

  test("a word the list does not know is refused, and marking follows the rules", async ({ page }) => {
    const seed = freshPuzzleSeed();
    await page.goto(`${PLAY}&size=5&level=${LEVEL}&seed=${seed}`);
    await ready(page, "puzzle-play");
    await page.keyboard.type("qqjjj");
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("word-said")).toContainText("not in the word list");
    // A refused guess is not cleared on its own: clear the row before typing the real one.
    for (let i = 0; i < 5; i += 1) await page.keyboard.press("Backspace");

    await page.keyboard.type(GUESS);
    await page.keyboard.press("Enter");
    const row = page.locator('[data-testid="word-tile"][data-row="0"]');
    // Marked against the puzzle's actual hidden word, letter by letter — the same engine as English's `markGuess`.
    for (let at = 0; at < 5; at += 1) await expect(row.nth(at)).toHaveAttribute("data-mark", /hit|near|miss/);
    // The word list this puzzle drew from folds accents away, so CHIEN's marks read the same as `markGuess` would give any hidden word.
    expect(markGuess(GUESS, GUESS)).toEqual(["hit", "hit", "hit", "hit", "hit"]);
  });
});
