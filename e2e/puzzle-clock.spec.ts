import { expect, test, type Page } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generatePuzzle } from "../src/lib/puzzles/generate";
import { isWord } from "../src/lib/puzzles/gomoji/code";
import { generateNumberPlace } from "../src/lib/puzzles/numberPlace/generate";
import { decodeCells } from "../src/lib/puzzles/puzzleCode";
import { ready } from "./support";
import { loadEveryWordList } from "./wordLists";

/**
 * A COUNTDOWN ON A PUZZLE: Tortoise, Fox or Rabbit, chosen on its set-up.
 *
 * John, 2026-09-26: "a TURTLE mode, RABBIT mode and some other animal in
 * between... fast one being like 1 minute counter." This chooses the Rabbit by
 * pressing its chip, starts, and watches the minute run down — the clock IS the
 * subject, so the page's clock is driven (`page.clock`), and only once the page
 * says it is listening. Out of time, the puzzle ends unsolved and is kept among
 * the finished ones, never left in My games as going; a solve made inside the
 * minute is on the Rabbit's own fastest table and not the untimed one.
 */
const SIZE = 4;
const LEVEL = "easy";

test.beforeAll(loadEveryWordList);
const AT = `/games/${PUZZLE_SLUGS.numberPlace}`;

/** The set-up, the Rabbit pressed, and Start: the grid it lands on, its seed read back from the page. */
async function startOnTheRabbit(page: Page) {
  await page.goto(`${AT}/new?size=${SIZE}&level=${LEVEL}`);
  await ready(page, "puzzle-set-up");
  const rabbit = page.getByTestId("puzzle-clock-rabbit");
  await rabbit.click();
  await expect(rabbit).toHaveAttribute("aria-checked", "true");
  await expect(page.getByTestId("puzzle-clock-blurb")).toContainText("One minute, counting down");
  await page.getByTestId("puzzle-solve").click();
  await expect(page).toHaveURL(/clock=rabbit/);
  await expect(page).toHaveURL(/seed=\d+/);
  await ready(page, "puzzle-play");
  const seed = Number(await page.getByTestId("puzzle-play").getAttribute("data-seed"));
  const puzzle = generateNumberPlace(SIZE, LEVEL, seed);
  return { seed, givens: decodeCells(puzzle.givens, SIZE)!, solution: decodeCells(puzzle.solution, SIZE)! };
}

test("the Rabbit counts down from a minute, is urgent at ten seconds, and runs out: unsolved, and kept as finished", async ({ page }) => {
  await page.clock.install();
  const { seed, givens, solution } = await startOnTheRabbit(page);
  const clock = page.getByTestId("puzzle-clock");
  // Counting down, from the whole minute, and still until the first entry.
  await expect(clock).toHaveAttribute("data-clock", "rabbit");
  await expect(clock).toHaveText("1:00");

  const first = givens.findIndex((given) => given === 0);
  await page.getByTestId("puzzle-cell").nth(first).click();
  await page.getByTestId(`puzzle-key-${solution[first]}`).click();

  await page.clock.runFor("00:45");
  await expect(clock).toHaveText(/^0:1[45]$/);
  await expect(clock).toHaveAttribute("data-urgent", "false");

  // The last ten seconds: urgent, and said once to a screen reader rather than every second.
  await page.clock.runFor("00:07");
  await expect(clock).toHaveAttribute("data-urgent", "true");
  await expect(page.getByTestId("puzzle-clock-said")).toHaveText("Ten seconds left.");

  await page.clock.runFor("00:10");
  const done = page.getByTestId("puzzle-done");
  await expect(done).toHaveAttribute("data-out-of-time", "true");
  await expect(page.getByTestId("puzzle-out-of-time")).toContainText("Out of time");
  await expect(clock).toHaveText("0:00");
  // The grid stays as it stood, and nothing more can be written on it.
  await expect(page.getByTestId("puzzle-cell").nth(first)).toHaveAttribute("data-value", String(solution[first]));
  await expect(page.getByTestId("puzzle-keys")).toHaveCount(0);
  // Kept: the site answered, and the card says where it went.
  await expect(page.getByTestId("puzzle-paid")).toContainText("ends unsolved");
  await expect(page.getByTestId("puzzle-out-of-time-kept")).toBeVisible();

  // Its own page says how it ended, on which clock, and draws the grid where it stood.
  await page.getByTestId("puzzle-see-solve").click();
  await expect(page.getByTestId("solve-outcome")).toHaveText("Out of time");
  await expect(page.getByTestId("solve-clock")).toContainText("Rabbit");
  await expect(page.getByTestId("solve-board")).toHaveAttribute("data-state", "unsolved");

  // Among the finished puzzles, marked unsolved and on the Rabbit — and not going.
  await page.goto("/play/completed");
  const kept = page.locator('[data-testid="puzzle-solved"][data-solved="false"]').filter({ hasText: "rabbit" }).first();
  await expect(kept).toBeVisible();
  await expect(kept).toContainText("Not solved");
  await page.goto("/play");
  await expect(page.getByTestId("my-games")).toBeVisible();
  await expect(page.locator(`[data-testid="puzzle-going"][data-seed="${seed}"]`), "a puzzle whose clock ran out is still listed as going").toHaveCount(0);
});

test("a Rabbit solved inside its minute is on the Rabbit's own fastest table, and not the untimed one", async ({ page }) => {
  await page.clock.install();
  const { givens, solution } = await startOnTheRabbit(page);
  for (const [index, given] of givens.entries()) {
    if (given !== 0) continue;
    await page.getByTestId("puzzle-cell").nth(index).click();
    await page.getByTestId(`puzzle-key-${solution[index]}`).click();
  }
  await expect(page.getByTestId("puzzle-done")).toContainText("Solved");
  await expect(page.getByTestId("puzzle-done")).toContainText("on the Rabbit");
  const replay = page.getByTestId("puzzle-see-solve");
  await expect(replay).toBeVisible();
  const solveId = (await replay.getAttribute("href"))!.split("/").pop()!;

  await page.goto(`${AT}/standings`);
  const rabbitRow = page.locator(`[data-testid="puzzle-fastest-row"][data-size="${SIZE}"][data-level="${LEVEL}"][data-clock="rabbit"]`);
  await expect(rabbitRow).toBeVisible();
  await expect(rabbitRow.getByTestId("puzzle-fastest-clock")).toContainText("Rabbit");
  // Its heading leads to exactly the solves it ranks: this size, level and clock.
  await expect(rabbitRow.getByTestId("puzzle-fastest-every")).toHaveAttribute("href", /size=4&level=easy&clock=rabbit/);
  // The untimed table is drawn (the page has answered) and this solve is not on it.
  const untimed = page.locator(`[data-testid="puzzle-fastest-row"][data-size="${SIZE}"][data-level="${LEVEL}"][data-clock="none"]`);
  await expect(untimed).toBeVisible();
  await expect(untimed.locator(`[data-solve="${solveId}"]`)).toHaveCount(0);
  // Where it ranks depends on other runs' Rabbits at this size; the table holds three, so look it up in the record the heading opens.
  await rabbitRow.getByTestId("puzzle-fastest-every").click();
  await expect(page.locator('[data-narrowing="clock"]')).toContainText("Rabbit");
  await expect(page.locator(`[data-testid="record-solve"][data-solve="${solveId}"]`)).toBeVisible();
});

test("a word on the Rabbit runs out with guesses to spare: the word is shown, and it is kept with the guesses made", async ({ page }) => {
  await page.clock.install();
  await page.goto(`/games/${PUZZLE_SLUGS.gomoji}/new?size=4&level=hard`);
  await ready(page, "puzzle-set-up");
  await page.getByTestId("puzzle-clock-rabbit").click();
  await expect(page.getByTestId("puzzle-clock-rabbit")).toHaveAttribute("aria-checked", "true");
  await page.getByTestId("puzzle-solve").click();
  await expect(page).toHaveURL(/clock=rabbit/);
  await expect(page).toHaveURL(/seed=\d+/);
  await ready(page, "puzzle-play");
  const seed = Number(await page.getByTestId("puzzle-play").getAttribute("data-seed"));
  const puzzle = generatePuzzle("gomoji", 4, "hard", seed);
  const guess = ["tree", "cake", "moon"].find((word) => word !== puzzle.solution && isWord(word, 4))!;
  await page.keyboard.type(guess);
  await page.keyboard.press("Enter");

  await page.clock.runFor("01:01");
  await expect(page.getByTestId("word-out")).toBeVisible();
  await expect(page.getByTestId("puzzle-out-of-time")).toContainText("Out of time");
  await expect(page.getByTestId("word-was")).toHaveText(puzzle.solution, { ignoreCase: true });
  // Kept, among the finished puzzles, as a word not found on the Rabbit.
  await expect(page.getByTestId("word-kept")).toContainText("My games");
  await page.getByTestId("word-kept").getByRole("link", { name: "My games" }).click();
  const kept = page.locator('[data-testid="puzzle-solved"][data-kind="gomoji"][data-solved="false"]').first();
  await expect(kept).toContainText("Not found");
  await expect(kept).toContainText("rabbit");
});
