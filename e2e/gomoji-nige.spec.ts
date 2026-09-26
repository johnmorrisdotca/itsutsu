import { expect, test } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generatePuzzle, prepareEveryPuzzle } from "../src/lib/puzzles/generate";
import { decodeGuesses, languageOf } from "../src/lib/puzzles/gomoji/code";
import { dodgeGuesses } from "../src/lib/puzzles/gomoji/dodgePlay";
import { freshDodgeSeed } from "../src/lib/puzzles/gomoji/dodgeSeed";
import { ready } from "./support";

/**
 * GOMOJI NIGE 逃げ: the word that dodges (`src/lib/puzzles/gomoji/dodge.ts`),
 * our version of the Absurdle idea, in every lettered Gomoji. Chosen on the
 * set-up screen, where it switches Head start off; played at an address that
 * says nige=1; every guess answered with the colours that leave the most words;
 * found only when one word is left and it is the one typed. The day's Nige has
 * a button a length beside the day's words, and the rules page says what it is.
 */
test.beforeAll(prepareEveryPuzzle);

test("choosing Nige at set-up switches Head start off and starts a word that dodges", async ({ page }) => {
  await page.goto(`/games/${PUZZLE_SLUGS.gomoji}/new`);
  await ready(page, "puzzle-set-up");
  await page.getByTestId("puzzle-level-easy").click();
  const start = page.getByTestId("puzzle-solve");
  await expect(page.getByTestId("puzzle-dodge-off")).toHaveAttribute("aria-checked", "true");
  await expect(start).not.toHaveAttribute("href", /nige=/);

  await page.getByTestId("puzzle-dodge-on").click();
  await expect(page.getByTestId("puzzle-dodge-blurb")).toContainText(/dodge/i);
  await expect(start).toHaveAttribute("href", /nige=1/);
  // Nothing is hidden, so there is nothing for a head start to grey.
  await expect(page.getByTestId("puzzle-head-start-on")).toBeDisabled();
  await expect(start).not.toHaveAttribute("href", /head-start=/);

  await start.click();
  await ready(page, "puzzle-play");
  await expect(page).toHaveURL(/nige=1/);
  await expect(page.getByTestId("puzzle-asked-dodge")).toContainText("Nige");
});

for (const kind of ["gomoji", "gomojiMot", "gomojiWort"] as const) {
  test(`${kind}: a dodger is pinned down by the guesses that leave it nowhere to go, and ends solved`, async ({ page }) => {
    const size = 5;
    const level = "medium";
    const seed = freshDodgeSeed();
    const puzzle = generatePuzzle(kind, size, level, seed);
    const way = decodeGuesses(puzzle.solution, size, languageOf(kind))!;
    expect(way.length).toBeLessThanOrEqual(dodgeGuesses(kind, size, level));

    await page.goto(`/games/${PUZZLE_SLUGS[kind]}/play?size=${size}&level=${level}&seed=${seed}`);
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("puzzle-asked-dodge")).toBeVisible();
    // A dodger's board is its own count of rows.
    await expect(page.getByTestId("word-tile")).toHaveCount(size * dodgeGuesses(kind, size, level));

    for (const guess of way) {
      await page.keyboard.type(guess);
      await page.keyboard.press("Enter");
    }
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
    // Every row before the last was answered without the word: it still had somewhere to hide.
    const last = page.locator(`[data-testid="word-tile"][data-row="${way.length - 1}"]`);
    for (let at = 0; at < size; at += 1) await expect(last.nth(at)).toHaveAttribute("data-mark", "hit");
  });
}

test("the day's Nige has a button a length beside the day's words, and the rules page says what Nige is", async ({ page }) => {
  await page.goto(`/games/${PUZZLE_SLUGS.gomoji}`);
  const buttons = page.getByTestId("nige-daily-play");
  await expect(buttons.first()).toBeVisible();
  await expect(buttons).toHaveCount(await page.getByTestId("daily-play").count());
  await expect(buttons.first()).toHaveAttribute("href", /nige=1/);

  await page.goto(`/games/${PUZZLE_SLUGS.gomoji}/rules`);
  await expect(page.getByText(/Nige/).first()).toBeVisible();
});
