import { expect, test, type Page } from "@playwright/test";

import "../src/lib/puzzles/gomoji/wordDataModule";
import { isWord } from "../src/lib/puzzles/gomoji/code";
import { loadWordData } from "../src/lib/puzzles/gomoji/wordData";
import { dailySeed } from "../src/lib/puzzles/daily";
import { generatePuzzle } from "../src/lib/puzzles/generate";
import { readFound, readHive } from "../src/lib/puzzles/hachinosu/code";
import type { Puzzle, PuzzleLevel } from "../src/lib/puzzles/puzzles.types";
import { freshPuzzleSeed, ready } from "./support";

/**
 * HACHINOSU 蜂の巣: words from seven letters, the centre in every one, until they are worth the goal. Played by pressing the
 * hive and by typing, the words made from the same seed the page uses. Its own: a word refused says why and stays
 * to be mended, the centre is required, and the game ends at the goal with what was missed shown.
 */
const AT = "/games/hachinosu";

test.beforeAll(async () => {
  await Promise.all([loadWordData("en"), loadWordData("de")]);
});

async function openPlay(page: Page, language: number, level: PuzzleLevel = "easy"): Promise<Puzzle> {
  const seed = freshPuzzleSeed();
  await page.goto(`${AT}/play?size=${language}&level=${level}&seed=${seed}`);
  await ready(page, "puzzle-play");
  return generatePuzzle("hachinosu", language, level, seed);
}

const pressWord = async (page: Page, word: string) => {
  for (const letter of word) await page.locator(`[data-testid="hachinosu-letter"][data-letter="${letter}"]`).click();
};
const send = (page: Page) => page.getByTestId("hachinosu-enter").click();

test.describe("Hachinosu, for a reader with no account", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("its front door and rules are open, at home in Word games, with today's puzzle a link for each language", async ({ page }) => {
    await page.goto(AT);
    await expect(page.getByTestId("game-front-door").getByRole("heading", { level: 1 })).toContainText("Hachinosu");
    await expect(page.getByTestId("game-family")).toContainText("Word games");
    await expect(page.getByTestId("game-daily")).toHaveCount(3);
    await page.getByTestId("game-rules-link").click();
    await expect(page.locator("main")).toContainText("must use the centre letter");
    await expect(page.getByTestId("open-source")).toContainText("Kotoba");
  });
});

test.describe("Hachinosu", () => {
  test("set up, played by pressing the hive to its goal, scored and kept", async ({ page }) => {
    await page.goto(`${AT}/new`);
    await ready(page, "puzzle-set-up");
    await page.locator('[data-testid="set-up-size"][data-size="1"]').click();
    await expect(page.getByTestId("set-up-puzzle-preview").getByTestId("hachinosu-hive")).toBeVisible();
    await page.getByTestId("puzzle-level-easy").click();
    await page.getByTestId("puzzle-solve").click();
    await expect(page).toHaveURL(/seed=\d+/);
    await ready(page, "puzzle-play");
    const seed = Number(await page.getByTestId("puzzle-play").getAttribute("data-seed"));
    const puzzle = generatePuzzle("hachinosu", 1, "easy", seed);
    await expect(page.getByTestId("hachinosu-letter")).toHaveCount(7);
    await expect(page.getByTestId("puzzle-clock")).toHaveText("0:00");

    for (const word of readFound(puzzle.solution)!) {
      await pressWord(page, word);
      await send(page);
    }
    await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
    expect(await page.getByTestId("puzzle-play").getAttribute("data-code")).toBe(puzzle.solution);
    await expect(page.getByTestId("puzzle-paid")).toContainText(/XP|Already paid|allowance/);
    await expect(page.getByTestId("hachinosu-missed-box")).toBeVisible();
    await page.getByTestId("puzzle-see-solve").click();
    await expect(page.getByTestId("solve-board")).toHaveAttribute("data-state", "finished");
    await expect(page.getByTestId("solve-board").getByTestId("hachinosu-found")).toContainText(readFound(puzzle.solution)![0]!);
  });

  test("a refused word says why and stays to be mended: too short, no centre, not a word, and found already", async ({ page }) => {
    const puzzle = await openPlay(page, 1);
    const hive = readHive(puzzle.givens)!;
    const said = page.getByTestId("hachinosu-said");
    const typed = page.getByTestId("hachinosu-typed");

    await pressWord(page, hive.centre.repeat(3));
    await send(page);
    await expect(said).toHaveAttribute("data-said", "short");
    await expect(typed).toHaveAttribute("data-typed", hive.centre.repeat(3));
    await page.getByTestId("hachinosu-delete").click();
    await expect(typed).toHaveAttribute("data-typed", hive.centre.repeat(2));
    await page.getByTestId("hachinosu-delete").click();
    await page.getByTestId("hachinosu-delete").click();

    // Four of an outer letter: long enough, with no centre.
    const outer = hive.letters[0]!;
    await pressWord(page, outer.repeat(4));
    await send(page);
    await expect(said).toHaveAttribute("data-said", "centre");
    for (let at = 0; at < 4; at += 1) await page.getByTestId("hachinosu-delete").click();

    // The centre with nonsense round it: right letters, and on no list.
    const nonsense = hive.centre.repeat(4) + outer + outer;
    expect(isWord(nonsense, 6, "en")).toBe(false);
    await pressWord(page, nonsense);
    await send(page);
    await expect(said).toHaveAttribute("data-said", "listed");
    for (let at = 0; at < 6; at += 1) await page.getByTestId("hachinosu-delete").click();

    // A word taken, then offered again.
    const word = readFound(puzzle.solution)![0]!;
    await pressWord(page, word);
    await send(page);
    await expect(page.getByTestId("hachinosu-found")).toContainText(word);
    await pressWord(page, word);
    await send(page);
    await expect(said).toHaveAttribute("data-said", "found");
  });

  test("the keyboard types the hive's letters only, and Backspace and Enter work", async ({ page }) => {
    const puzzle = await openPlay(page, 1);
    const hive = readHive(puzzle.givens)!;
    const word = readFound(puzzle.solution)![0]!;
    const outsider = [..."abcdefghijklmnopqrstuvwxyz"].find((letter) => !(hive.centre + hive.letters).includes(letter))!;
    await page.keyboard.press(outsider);
    await expect(page.getByTestId("hachinosu-typed")).toHaveAttribute("data-typed", "");
    await page.keyboard.type(word);
    await expect(page.getByTestId("hachinosu-typed")).toHaveAttribute("data-typed", word);
    await page.keyboard.press("Backspace");
    await expect(page.getByTestId("hachinosu-typed")).toHaveAttribute("data-typed", word.slice(0, -1));
    await page.keyboard.type(word.at(-1)!);
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("hachinosu-found")).toContainText(word);
    await expect(page.getByTestId("hachinosu-typed")).toHaveAttribute("data-typed", "");
  });

  test("Shuffle moves the outer letters and keeps the centre", async ({ page }) => {
    const puzzle = await openPlay(page, 1);
    const hive = readHive(puzzle.givens)!;
    const letters = async () => page.getByTestId("hachinosu-letter").evaluateAll((all) => all.map((one) => one.getAttribute("data-letter")).join(""));
    await expect(page.locator('[data-testid="hachinosu-letter"][data-centre="true"]')).toHaveAttribute("data-letter", hive.centre);
    const before = await letters();
    await expect.poll(async () => {
      await page.getByTestId("hachinosu-shuffle").click();
      return letters();
    }).not.toBe(before);
    await expect(page.locator('[data-testid="hachinosu-letter"][data-centre="true"]')).toHaveAttribute("data-letter", hive.centre);
  });

  test("left half done it waits in My games and opens with its words", async ({ page }) => {
    const puzzle = await openPlay(page, 1, "hard");
    const word = readFound(puzzle.solution)![0]!;
    await pressWord(page, word);
    await send(page);
    await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-code", word);
    await page.getByTestId("puzzle-pause").click();
    await expect(page.getByTestId("puzzle-paused")).toBeVisible();
    await page.getByRole("navigation").getByRole("link", { name: /^My games/ }).first().click();
    await expect(page).toHaveURL(/\/play$/);
    await ready(page, "tabs");
    await page.locator('[data-testid="tab"][data-tab="going"]').click();
    const row = page.locator(`[data-testid="puzzle-going"][data-kind="hachinosu"][data-seed="${puzzle.seed}"]`);
    await expect(row).toBeVisible();
    await row.getByTestId("puzzle-going-continue").click();
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-code", word);
    await expect(page.getByTestId("hachinosu-found")).toContainText(word);
  });

  test("German is the same card, with German words", async ({ page }) => {
    const puzzle = await openPlay(page, 3);
    const word = readFound(puzzle.solution)![0]!;
    expect(isWord(word, word.length, "de")).toBe(true);
    await pressWord(page, word);
    await send(page);
    await expect(page.getByTestId("hachinosu-found")).toContainText(word);
  });

  test("today's hive is one seed for everybody, whichever language", async ({ page }) => {
    await page.goto(AT);
    await page.locator('[data-testid="game-daily"][data-way="3"]').click();
    await ready(page, "puzzle-play");
    await expect(page.getByTestId("puzzle-play")).toHaveAttribute("data-seed", String(dailySeed(new Date())));
  });

  test("is one card on Word games' shelf", async ({ page }) => {
    await page.goto("/games/hachinosu/family");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Word games");
    await expect(page.getByTestId("family-games").getByText("Hachinosu", { exact: false })).toHaveCount(1);
  });
});
