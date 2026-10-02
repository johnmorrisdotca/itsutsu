import { expect, test } from "@playwright/test";

import { PUZZLE_SLUGS, playPath } from "../src/lib/gomoku/slugs";
import { isWord, markGuess } from "../src/lib/puzzles/gomoji/code";
import { guessesFor } from "../src/lib/puzzles/gomoji/layout";
import { freshPuzzleSeed, ready } from "./support";
import { loadEveryWordList } from "./wordLists";

// Words worked out here, in node, need Gomoji's lists loaded (`wordLists.ts`).
test.beforeAll(loadEveryWordList);

/**
 * Gomoji Wort: the German Gomoji, on the QWERTZ keyboard drawn under the
 * grid, with Ä, Ö and Ü as keys of their own. Same engine as English's Gomoji
 * (`gomoji.spec.ts`) — what this spec drives is what is different: the extra
 * umlaut keys, and the CC BY-SA credit line.
 */
const KIND = "gomojiWort";
const LEVEL = "medium";
// Its address from before 2026-09-28, which leads on to the one Gomoji (`formerAddresses.ts`).
const AT = `/games/${PUZZLE_SLUGS[KIND]}`;
// Where it is played now: the one Gomoji's board and set-up, the setting in the query (`gameSettings.ts`).
const PLAY = playPath(KIND);
const GUESS = "bände"; // "volumes": five letters, carries an Ä, in the guessable list.

test.describe("Gomoji Wort", () => {
  test("its old front door leads to the one Gomoji, which names it among its languages and word lists", async ({ page }) => {
    await page.goto(AT);
    // One Gomoji now: its old address is a setting of it (John, 2026-09-28: "just have 1 and allow language selection").
    await expect(page).toHaveURL(/\/games\/gomoji\?language=german$/);
    await expect(page.getByTestId("game-front-door").getByRole("heading", { level: 1 })).toHaveText(/^Gomoji/);
    await expect(page.getByTestId("inspired-by")).toContainText("Wordle");
    await expect(page.getByTestId("game-family")).toContainText("Word games");
    await expect(page.locator('[data-testid="word-setting-row"][data-kind="gomojiWort"]')).toContainText("Deutsch");
  });

  test.describe("on a phone, typed on the QWERTZ keys", () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

    test("a guess with an Ä typed on the on-screen keys is coloured, and the credit line names the source", async ({ page }) => {
      expect(isWord(GUESS, 5, "de")).toBe(true);
      const seed = freshPuzzleSeed();
      await page.goto(`${PLAY}&size=5&level=${LEVEL}&seed=${seed}`);
      await ready(page, "puzzle-play");
      // Laid out as English Gomoji is: the level decides the guesses (`layout.ts`).
      await expect(page.getByTestId("word-tile")).toHaveCount(5 * guessesFor("gomoji", 5, LEVEL, 0));

      // Ä is a key of its own here, not a fold of A — QWERTZ carries it beside L.
      await expect(page.getByTestId("word-key-ä")).toBeVisible();
      await expect(page.getByTestId("word-key-ö")).toBeVisible();
      await expect(page.getByTestId("word-key-ü")).toBeVisible();
      for (const letter of GUESS) await page.getByTestId(`word-key-${letter}`).click();
      await page.getByTestId("word-key-enter").click();

      const row = page.locator('[data-testid="word-tile"][data-row="0"]');
      const marks = await row.evaluateAll((cells) => cells.map((cell) => cell.getAttribute("data-mark")));
      expect(marks.every((mark) => mark === "hit" || mark === "near" || mark === "miss")).toBe(true);
      // The Ä typed shows as Ä on the tile, never folded to A.
      await expect(row.nth(1)).toHaveAttribute("aria-label", /^Ä, /);

      // The dictionaries' and FrequencyWords' CC BY-SA credit, shown on the play page as JMdict's is for Gomoji Kana.
      await expect(page.getByTestId("word-credit")).toContainText("FrequencyWords");
      await expect(page.getByTestId("word-credit")).toContainText("LanguageTool");
      await expect(page.getByTestId("word-credit")).toContainText("Wiktionary");
    });
  });

  test.describe("a word the list does not know is refused, and marking follows the rules", () => {
    // The on-screen keys are needed for Ä, and they are hidden by default on a desk's pointer.
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

    test("refused, then cleared, then marked", async ({ page }) => {
      const seed = freshPuzzleSeed();
      await page.goto(`${PLAY}&size=5&level=${LEVEL}&seed=${seed}`);
      await ready(page, "puzzle-play");
      await page.keyboard.type("qqjjj");
      await page.keyboard.press("Enter");
      await expect(page.getByTestId("word-said")).toContainText("not in the word list");
      // A refused guess is not cleared on its own: clear the row before typing the real one.
      for (let i = 0; i < 5; i += 1) await page.getByTestId("word-key-back").click();

      for (const letter of GUESS) await page.getByTestId(`word-key-${letter}`).click();
      await page.getByTestId("word-key-enter").click();
      const row = page.locator('[data-testid="word-tile"][data-row="0"]');
      for (let at = 0; at < 5; at += 1) await expect(row.nth(at)).toHaveAttribute("data-mark", /hit|near|miss/);
      expect(markGuess(GUESS, GUESS)).toEqual(["hit", "hit", "hit", "hit", "hit"]);
    });
  });
});
