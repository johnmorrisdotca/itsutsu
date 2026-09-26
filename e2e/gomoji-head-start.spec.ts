import { expect, test, type Page } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generatePuzzle, prepareEveryPuzzle } from "../src/lib/puzzles/generate";
import { isWord } from "../src/lib/puzzles/gomoji/code";
import { headStartKeys } from "../src/lib/puzzles/gomoji/headStart";
import { decodeKanaGivens } from "../src/lib/puzzles/gomojiKana/kanaCode";
import { kanaBase } from "../src/lib/puzzles/gomojiKana/kanaMarks";
import { tapKana } from "./kanaTyping";
import { ready } from "./support";

/**
 * GOMOJI'S HEAD START (src/lib/puzzles/gomoji/headStart.ts). John, 2026-09-26:
 * "add another game option for easy mode… a random N chars based on word size,
 * will already be eliminated for you on the keyboard. Like a free word guess
 * without taking up size on the board."
 *
 * Chosen by clicking on the set-up screen, never typed into an address: the
 * keyboard opens with as many keys grey as the word is long, none of them in
 * the word; the summary says so; the word is solved and kept with it, and its
 * page replays it. Easy only: at medium and hard the chips are switched off.
 */
test.beforeAll(prepareEveryPuzzle);

/** Chooses Easy and Head start on a Gomoji's set-up screen, presses Start, and answers the puzzle it opened. */
async function startWithHeadStart(page: Page, kind: "gomoji" | "gomojiKana") {
  await page.goto(`/games/${PUZZLE_SLUGS[kind]}/new`);
  await ready(page, "puzzle-set-up");
  await page.getByTestId("puzzle-level-easy").click();
  await expect(page.getByTestId("puzzle-head-start-off")).toHaveAttribute("aria-checked", "true");
  const start = page.getByTestId("puzzle-solve");
  await expect(start).not.toHaveAttribute("href", /head-start=/);
  await page.getByTestId("puzzle-head-start-on").click();
  await expect(start).toHaveAttribute("href", /level=easy.*head-start=1/);
  await start.click();
  await ready(page, "puzzle-play");
  await expect(page).toHaveURL(/head-start=1/);
  await expect(page.getByTestId("puzzle-asked-head-start")).toContainText("Head start");
  const url = new URL(page.url());
  const size = Number(url.searchParams.get("size"));
  const seed = Number(url.searchParams.get("seed"));
  const puzzle = generatePuzzle(kind, size, "easy", seed);
  return { size, seed, puzzle, keys: headStartKeys(kind, size, puzzle.givens) };
}

test.describe("Gomoji's head start", () => {
  test("greys as many letters as the word has, none of them in it, is solved with it, kept and replayed", async ({ page }) => {
    const { size, puzzle, keys } = await startWithHeadStart(page, "gomoji");
    const word = puzzle.solution;
    expect(keys).toHaveLength(size);
    for (const key of keys) {
      expect(word.includes(key), `${key} is a letter of ${word}`).toBe(false);
      await expect(page.getByTestId(`word-key-${key}`)).toHaveAttribute("data-mark", "miss");
    }
    // Before any guess, those and only those are grey, and no row of the board is used.
    await expect(page.locator('[data-testid^="word-key-"][data-mark="miss"]')).toHaveCount(size);
    await expect(page.locator('[data-testid="word-tile"][data-row="0"]').first()).toHaveAttribute("data-mark", "empty");

    await page.keyboard.type(word);
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("puzzle-done")).toBeVisible();
    await expect(page.getByTestId("word-score-head-start")).toContainText("−50");
    await expect(page.getByTestId("puzzle-paid")).toHaveText(/XP|Already paid/);

    // Kept with it: its own page says so and replays the keyboard with the same keys grey.
    await page.goto(`/games/${PUZZLE_SLUGS.gomoji}/me`);
    await page.getByTestId("word-history-word").filter({ hasText: new RegExp(`^${word}$`, "i") }).first().click();
    await expect(page.getByTestId("solve-puzzle")).toContainText("Head start");
    await expect(page.getByTestId("solve-help")).toHaveText("Head start");
    for (const key of keys) await expect(page.getByTestId(`word-key-${key}`)).toHaveAttribute("data-mark", "miss");
  });

  test("a run left half way is kept with its head start, and Continue opens it with the same keys grey", async ({ page }) => {
    const { puzzle, keys, seed } = await startWithHeadStart(page, "gomoji");
    const guess = ["slate", "irony", "chump", "gawky", "fjord", "blitz", "mound"].find((each) => each !== puzzle.solution && isWord(each, 5))!;
    await page.keyboard.type(guess);
    await page.keyboard.press("Enter");
    await expect(page.locator('[data-testid="word-tile"][data-row="0"]').first()).not.toHaveAttribute("data-mark", /^(typed|empty)$/);

    await page.getByRole("navigation").getByRole("link", { name: /^My games/ }).first().click();
    await ready(page, "tabs");
    await page.locator('[data-testid="tab"][data-tab="puzzles"]').click();
    const row = page.locator(`[data-testid="puzzle-going"][data-kind="gomoji"][data-seed="${seed}"]`);
    await expect(row).toContainText("head start");
    const onward = row.getByTestId("puzzle-going-continue");
    await expect(onward).toHaveAttribute("href", /head-start=1/);
    await onward.click();
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("puzzle-asked-head-start")).toBeVisible();
    for (const key of keys) await expect(page.getByTestId(`word-key-${key}`)).toHaveAttribute("data-mark", "miss");
  });

  test("is not offered at medium or hard, and an address asking for it there gets none", async ({ page }) => {
    await page.goto(`/games/${PUZZLE_SLUGS.gomoji}/new`);
    await ready(page, "puzzle-set-up");
    await page.getByTestId("puzzle-level-easy").click();
    await page.getByTestId("puzzle-head-start-on").click();
    for (const level of ["medium", "hard"] as const) {
      await page.getByTestId(`puzzle-level-${level}`).click();
      await expect(page.getByTestId("puzzle-head-start-on")).toBeDisabled();
      await expect(page.getByTestId("puzzle-head-start-off")).toBeDisabled();
      await expect(page.getByTestId("puzzle-head-start-blurb")).toContainText("for easy");
      await expect(page.getByTestId("puzzle-solve")).toHaveAttribute("href", new RegExp(`level=${level}`));
      await expect(page.getByTestId("puzzle-solve")).not.toHaveAttribute("href", /head-start=/);
    }
    await page.goto(`/games/${PUZZLE_SLUGS.gomoji}/play?size=5&level=medium&seed=4242&head-start=1`);
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("puzzle-asked")).toContainText("Medium");
    await expect(page.getByTestId("puzzle-asked-head-start")).toHaveCount(0);
    await expect(page.locator('[data-testid^="word-key-"][data-mark="miss"]')).toHaveCount(0);
  });

  test("in kana, greys as many kana keys as the word is long, none of its kana nor the free word's, and is solved and kept", async ({ page }) => {
    const { size, puzzle, keys } = await startWithHeadStart(page, "gomojiKana");
    const { word, grey } = decodeKanaGivens(puzzle.givens, size)!;
    const out = new Set([...word, ...(grey ?? "")].map(kanaBase));
    expect(keys).toHaveLength(size);
    for (const key of keys) {
      expect(out.has(key), `${key} against ${word} and ${grey}`).toBe(false);
      await expect(page.getByTestId(`kana-key-${key}`)).toHaveAttribute("data-mark", "miss");
    }

    await tapKana(page, word);
    await page.getByTestId("kana-key-enter").click();
    await expect(page.getByTestId("puzzle-done")).toBeVisible();
    await expect(page.getByTestId("word-score-head-start")).toContainText("−50");

    await page.goto(`/games/${PUZZLE_SLUGS.gomojiKana}/me`);
    await page.getByTestId("word-history-word").filter({ hasText: word }).first().click();
    await expect(page.getByTestId("solve-puzzle")).toContainText("Head start");
    for (const key of keys) await expect(page.getByTestId(`kana-key-${key}`)).toHaveAttribute("data-mark", "miss");
  });
});
