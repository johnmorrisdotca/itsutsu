import { expect, test } from "@playwright/test";

import { PUZZLE_SLUGS } from "../src/lib/gomoku/slugs";
import { generatePuzzle, prepareEveryPuzzle } from "../src/lib/puzzles/generate";
import { isWord } from "../src/lib/puzzles/gomoji/code";
import { generateNumberPlace } from "../src/lib/puzzles/numberPlace/generate";
import { decodeCells } from "../src/lib/puzzles/puzzleCode";
import { freshPuzzleSeed, ready } from "./support";

/**
 * A COUNTDOWN ON EVERY PUZZLE (`countdown.ts`): none, the Tortoise's five
 * minutes, the Fox's three or the Rabbit's one, chosen on the set-up screen and
 * carried in the address, so a reload keeps it. When it runs out the puzzle
 * ends unsolved, as it stood, and is kept in My games.
 *
 * The clock is driven, never waited out, and wound only after the page says
 * it is listening (its ready mark): the countdown is a timer set once the
 * first entry starts the clock. The Rabbit's minute is shorter than the two
 * minutes that ask "are you still there?", so that question never interrupts.
 */
test.beforeAll(prepareEveryPuzzle);

test("the countdown is chosen on the set-up screen, goes in the address, and a reload keeps it", async ({ page }) => {
  await page.goto(`/games/${PUZZLE_SLUGS.numberPlace}/new`);
  await ready(page, "puzzle-set-up");
  await expect(page.getByTestId("puzzle-countdown-none")).toHaveAttribute("aria-checked", "true");
  await expect(page.getByTestId("puzzle-solve")).not.toHaveAttribute("href", /countdown=/);

  await page.getByTestId("puzzle-countdown-rabbit").click();
  await expect(page.getByTestId("puzzle-countdown-rabbit")).toHaveAttribute("aria-checked", "true");
  await expect(page.getByTestId("puzzle-countdown-blurb")).toContainText("minute");
  await expect(page.getByTestId("puzzle-solve")).toHaveAttribute("href", /countdown=rabbit/);

  await page.getByTestId("puzzle-solve").click();
  await expect(page).toHaveURL(/countdown=rabbit/);
  await ready(page, "puzzle-play");
  await expect(page.getByTestId("puzzle-countdown")).toContainText("Rabbit");
  await page.reload();
  await ready(page, "puzzle-play");
  await expect(page.getByTestId("puzzle-countdown")).toContainText("1:00");
});

test("a grid whose Rabbit runs out ends unsolved and says so", async ({ page }) => {
  await page.clock.install();
  const seed = freshPuzzleSeed();
  const givens = decodeCells(generateNumberPlace(4, "easy", seed).givens, 4)!;
  await page.goto(`/games/${PUZZLE_SLUGS.numberPlace}/play?size=4&level=easy&seed=${seed}&countdown=rabbit`);
  await ready(page, "puzzle-play");
  // The clock, and so the countdown, starts on the first entry.
  await page.getByTestId("puzzle-cell").nth(givens.findIndex((given) => given === 0)).click();
  await page.getByTestId("puzzle-key-1").click();

  await page.clock.runFor("01:05");
  await expect(page.getByTestId("puzzle-time-up"), "the countdown ran out and nothing ended").toBeVisible();
  await expect(page.getByTestId("puzzle-done")).toHaveAttribute("data-ended", "time");
});

test("a word whose Rabbit runs out shows the word it was", async ({ page }) => {
  await page.clock.install();
  const seed = freshPuzzleSeed();
  const answer = generatePuzzle("gomoji", 5, "easy", seed).solution;
  const miss = ["jumpy", "fizzy", "whisk", "gawky", "vouch", "blitz", "chump", "fjord", "mound", "crypt"].find((word) => word !== answer && isWord(word, 5))!;
  await page.goto(`/games/${PUZZLE_SLUGS.gomoji}/play?size=5&level=easy&seed=${seed}&countdown=rabbit`);
  await ready(page, "puzzle-play");
  await page.keyboard.type(miss);
  await page.keyboard.press("Enter");

  await page.clock.runFor("01:05");
  await expect(page.getByTestId("puzzle-time-up")).toBeVisible();
  await expect(page.getByTestId("word-out-of-time")).toContainText(new RegExp(answer, "i"));
});
