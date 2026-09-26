import { expect, test } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generatePuzzle, prepareEveryPuzzle } from "../src/lib/puzzles/generate";
import { decodeGuesses, languageOf } from "../src/lib/puzzles/gomoji/code";
import { backwardsGuesses } from "../src/lib/puzzles/gomoji/backwardsRows";
import { hiddenOfPlay } from "../src/lib/puzzles/gomoji/backwardsPlay";
import { freshBackwardsSeed } from "../src/lib/puzzles/gomoji/backwardsSeed";
import { ready } from "./support";

/**
 * GOMOJI SAKASA 逆さ: a Gomoji played backwards (`src/lib/puzzles/gomoji/backwards.ts`),
 * our version of the Antiwordle idea, in every lettered Gomoji. Chosen on the
 * set-up screen, where it switches Head start off; played at an address that
 * says sakasa=1; won by filling every row without typing the word, lost by
 * typing it; every letter uncovered used again and no grey typed twice. The
 * day's Sakasa has a button a length beside the day's words.
 */
test.beforeAll(prepareEveryPuzzle);

test("choosing Sakasa at set-up switches Head start off, and a reload keeps it", async ({ page }) => {
  await page.goto(`/games/${PUZZLE_SLUGS.gomoji}/new`);
  await ready(page, "puzzle-set-up");
  await page.getByTestId("puzzle-level-easy").click();
  const start = page.getByTestId("puzzle-solve");
  await expect(page.getByTestId("puzzle-backwards-off")).toHaveAttribute("aria-checked", "true");
  await expect(start).not.toHaveAttribute("href", /sakasa=/);

  await page.getByTestId("puzzle-backwards-on").click();
  await expect(page.getByTestId("puzzle-backwards-blurb")).toContainText(/without typing it/);
  await expect(start).toHaveAttribute("href", /sakasa=1/);
  await expect(page.getByTestId("puzzle-head-start-on")).toBeDisabled();

  await start.click();
  await ready(page, "puzzle-play");
  await expect(page).toHaveURL(/sakasa=1/);
  await expect(page.getByTestId("puzzle-asked-backwards")).toContainText("Sakasa");
  await page.reload();
  await ready(page, "puzzle-play");
  await expect(page.getByTestId("puzzle-asked-backwards")).toContainText("Sakasa");
});

for (const kind of ["gomoji", "gomojiMot", "gomojiWort"] as const) {
  test(`${kind}: every row filled without the word is a win`, async ({ page }) => {
    const size = 5;
    const level = "easy";
    const seed = freshBackwardsSeed();
    const puzzle = generatePuzzle(kind, size, level, seed);
    const way = decodeGuesses(puzzle.solution, size, languageOf(kind))!;
    expect(way.length).toBe(backwardsGuesses(kind, size, level));

    await page.goto(`/games/${PUZZLE_SLUGS[kind]}/play?size=${size}&level=${level}&seed=${seed}`);
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("word-tile")).toHaveCount(size * way.length);
    for (const guess of way) {
      await page.keyboard.type(guess);
      await page.keyboard.press("Enter");
    }
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
    await expect(page.getByTestId("word-score-through")).toBeVisible();
  });
}

test("typing the word ends it, caught on that row", async ({ page }) => {
  const kind = "gomoji";
  const size = 5;
  const seed = freshBackwardsSeed();
  const puzzle = generatePuzzle(kind, size, "easy", seed);
  const word = hiddenOfPlay(kind, size, puzzle.givens)!;
  const [first] = decodeGuesses(puzzle.solution, size, "en")!;

  await page.goto(`/games/${PUZZLE_SLUGS[kind]}/play?size=${size}&level=easy&seed=${seed}`);
  await ready(page, "puzzle-play");
  await page.keyboard.type(first!);
  await page.keyboard.press("Enter");
  // Nothing is refused for a word that keeps to the first row, as the hidden word always does.
  await page.keyboard.type(word);
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("word-out")).toContainText("Caught on row 2");
  await expect(page.getByTestId("word-was")).toHaveText(new RegExp(word, "i"));
});

test("the day's Sakasa has a button a length beside the day's words, and the rules say what it is", async ({ page }) => {
  await page.goto(`/games/${PUZZLE_SLUGS.gomoji}`);
  const buttons = page.getByTestId("sakasa-daily-play");
  await expect(buttons.first()).toBeVisible();
  await expect(buttons).toHaveCount(await page.getByTestId("daily-play").count());
  await expect(buttons.first()).toHaveAttribute("href", /sakasa=1/);

  await page.goto(`/games/${PUZZLE_SLUGS.gomoji}/rules`);
  await expect(page.getByText(/Sakasa/).first()).toBeVisible();
});
